import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProgresoModuloResultado } from './type/ProgresoModuloResultado';
import { CertificadoService } from 'src/modules/certificado/certificado.service';
import { NotificacionesService } from 'src/modules/notificaciones/notificaciones.service';

@Injectable()
export class ProgresoService {

  constructor(private readonly prisma: PrismaService,
    private readonly certificadoService: CertificadoService,
    private readonly notificacionesService: NotificacionesService
  ) { }

  async recalcularProgresoModulo(inscripcionId: string) {
    const inscripcion = await this.prisma.inscripcion.findUnique({
      where: {
        id: inscripcionId,
      },
      include: {
        modulo: {
          select: {
            id: true,
            nombre: true,
            cursoId: true,
            curso: {
              select: {
                id: true,
                nombre: true,
              }
            }
          },
        },
      },
    });

    if (!inscripcion) {
      throw new NotFoundException("Inscripción no encontrada");
    }

    const leccionesTotales = await this.prisma.leccion.count({
      where: {
        moduloId: inscripcion.moduloId,
        estaPublicada: true,
      },
    });

    const leccionesCompletadas =
      await this.prisma.progresoLeccion.count({
        where: {
          inscripcionId: inscripcion.id,
          completadoEn: {
            not: null,
          },
          leccion: {
            estaPublicada: true,
          },
        },
      });

    const porcentaje =
      leccionesTotales === 0
        ? 0
        : Number(
          ((leccionesCompletadas / leccionesTotales) * 100).toFixed(2),
        );

    const completado =
      leccionesTotales > 0 &&
      leccionesCompletadas >= leccionesTotales;

    const estado = completado ? "completado" : "en_progreso";

    const progresoExistente =
      await this.prisma.progresoModulo.findUnique({
        where: {
          inscripcionId: inscripcion.id,
        },
      });

    const transicionACompletado =
      completado && progresoExistente?.estado !== 'completado';

    const completadoEn = completado
      ? progresoExistente?.completadoEn ?? new Date()
      : null;

    const progresoModulo =
      await this.prisma.progresoModulo.upsert({
        where: {
          inscripcionId: inscripcion.id,
        },

        update: {
          estado,
          porcentaje,
          leccionesTotales,
          leccionesCompletadas,
          completadoEn,
        },

        create: {
          inscripcionId: inscripcion.id,
          estado,
          porcentaje,
          leccionesTotales,
          leccionesCompletadas,
          completadoEn,
        },
      });

    await this.prisma.inscripcion.update({
      where: {
        id: inscripcion.id,
      },
      data: {
        porcentajeAvance: porcentaje,
        fechaFinalizacion: completado
          ? progresoModulo.completadoEn
          : null,
      },
    });

    let cursoCompleto = false;

    if (transicionACompletado) {
      await this.certificadoService.emitirCertificadoModulo(inscripcion.id);
      await this.notificacionesService.crearUnica({
        usuarioId: inscripcion.estudianteId,
        tipo: 'modulo_completado',
        titulo: `¡Felicidades! Has completado el módulo "${inscripcion.modulo.nombre}"`,
        contenido: `Has completado todas las lecciones del módulo "${inscripcion.modulo.nombre}". ¡Sigue así!`,
        urlAccion: '/certificados',
      });

      cursoCompleto = await this.verificarCursoCompleto(
        inscripcion.estudianteId,
        inscripcion.modulo.cursoId,
      );

      if (cursoCompleto) {
        await this.certificadoService.verificarYEmitirCertificadoCurso(
          inscripcion.estudianteId,
          inscripcion.modulo.cursoId,
        );

        await this.notificacionesService.crearUnica({
          usuarioId: inscripcion.estudianteId,
          tipo: 'curso_completado',
          titulo: `¡Felicidades! Has completado el curso`,
          contenido: `Has completado el curso "${inscripcion.modulo.curso.nombre}".`,
          urlAccion: '/certificados'
        });
      }
    }

    return {
      id: progresoModulo.id,
      inscripcionId: progresoModulo.inscripcionId,

      modulo: inscripcion.modulo,

      estado: progresoModulo.estado,
      porcentaje: progresoModulo.porcentaje,

      leccionesTotales: progresoModulo.leccionesTotales,
      leccionesCompletadas:
        progresoModulo.leccionesCompletadas,

      leccionesPendientes:
        progresoModulo.leccionesTotales -
        progresoModulo.leccionesCompletadas,

      completadoEn: progresoModulo.completadoEn,
      actualizadoEn: progresoModulo.actualizadoEn,

      transicionACompletado,
      cursoCompleto: transicionACompletado && cursoCompleto,
    };
  }

  async obtenerPorModuloYUsuario(moduloId: string, estudianteId: string,) {
    const inscripcion =
      await this.prisma.inscripcion.findFirst({
        where: { moduloId, estudianteId },
      });

    if (!inscripcion) {
      throw new NotFoundException("El estudiante no está inscrito en este módulo",);
    }

    return this.recalcularProgresoModulo(inscripcion.id);
  }

  async obtenerPorInscripcion(inscripcionId: string,) {
    return this.recalcularProgresoModulo(inscripcionId);
  }

  async obtenerPorUsuario(
    estudianteId: string,
  ): Promise<ProgresoModuloResultado[]> {
    const inscripciones =
      await this.prisma.inscripcion.findMany({
        where: {
          estudianteId,
        },
        select: {
          id: true,
        },
      });

    const progresos: ProgresoModuloResultado[] = [];

    for (const inscripcion of inscripciones) {
      const progreso =
        await this.recalcularProgresoModulo(
          inscripcion.id,
        );

      progresos.push(progreso);
    }

    return progresos;
  }

  async obtenerResumenModulo(moduloId: string) {
    const modulo = await this.prisma.modulo.findUnique({
      where: {
        id: moduloId,
      },
      select: {
        id: true,
        nombre: true,
        cursoId: true,
      },
    });

    if (!modulo) {
      throw new NotFoundException("Módulo no encontrado");
    }

    const leccionesTotales =
      await this.prisma.leccion.count({
        where: {
          moduloId,
          estaPublicada: true,
        },
      });

    const estudiantesInscritos =
      await this.prisma.inscripcion.count({
        where: {
          moduloId,
        },
      });

    return {
      modulo,
      leccionesTotales,
      estudiantesInscritos,
    };
  }

  private async verificarCursoCompleto(estudianteId: string, cursoId: string): Promise<boolean> {
    const modulosTotales = await this.prisma.modulo.count({
      where: { cursoId, estaPublicado: true },
    });

    if (modulosTotales === 0) return false;

    const modulosCompletados = await this.prisma.inscripcion.count({
      where: {
        estudianteId,
        modulo: { cursoId, estaPublicado: true },
        progresoModulo: { estado: 'completado' },
      },
    });

    const regla = await this.prisma.reglaCertificacionCurso.findUnique({ where: { cursoId } });
    const porcentajeRequerido = regla?.porcentajeModulosRequerido ?? 100;
    const porcentajeActual = (modulosCompletados / modulosTotales) * 100;

    await this.prisma.progresoCurso.upsert({
      where: { cursoId_estudianteId: { cursoId, estudianteId } },
      update: { modulosTotales, modulosCompletados, porcentaje: porcentajeActual },
      create: { cursoId, estudianteId, modulosTotales, modulosCompletados, porcentaje: porcentajeActual },
    });

    return porcentajeActual >= porcentajeRequerido;
  }
}
