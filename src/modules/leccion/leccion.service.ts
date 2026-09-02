import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateLeccionDto } from "./dto/create-leccion.dto";
import { UpdateLeccionDto } from "./dto/update-leccion.dto";
import { QueryLeccionDto } from "./dto/query-leccion.dto";
import { ProgresoService } from "src/modules/progreso/progreso.service";

@Injectable()
export class LeccionService {
  constructor(private readonly prisma: PrismaService,
    private readonly progresoService: ProgresoService
  ) { }

  async create(dto: CreateLeccionDto) {
    const modulo = await this.prisma.modulo.findUnique({ where: { id: dto.moduloId } });
    if (!modulo) {
      throw new NotFoundException("El módulo indicado no existe");
    }

    return this.prisma.$transaction(async (tx) => {
      const totalLecciones = await tx.leccion.count({ where: { moduloId: dto.moduloId } });

      const ordenDeseado = dto.orden ?? totalLecciones + 1;
      const ordenFinal = Math.min(Math.max(ordenDeseado, 1), totalLecciones + 1);

      if (ordenFinal <= totalLecciones) {
        await tx.leccion.updateMany({
          where: { moduloId: dto.moduloId, orden: { gte: ordenFinal } },
          data: { orden: { increment: 1 } },
        });
      }
      return tx.leccion.create({ data: { ...dto, orden: ordenFinal } });
    });
  }

  async findByModulo(moduloId: string, query: QueryLeccionDto) {
    const modulo = await this.prisma.modulo.findUnique({ where: { id: moduloId } });
    if (!modulo) {
      throw new NotFoundException("Módulo no encontrado");
    }

    const { nombre, tipoLeccion, estaPublicada } = query;

    const where: Prisma.LeccionWhereInput = {
      moduloId,
      ...(nombre && { nombre: { contains: nombre, mode: "insensitive" } }),
      ...(tipoLeccion && { tipoLeccion }),
      estaPublicada: estaPublicada !== undefined ? estaPublicada : true,
    };

    return this.prisma.leccion.findMany({
      where,
      orderBy: { orden: "asc" },
      include: { recursos: { orderBy: { orden: "asc" } } },
    });
  }

  async findByModuloConProgreso(moduloId: string, estudianteId: string) {
    const modulo = await this.prisma.modulo.findUnique({ where: { id: moduloId } });
    if (!modulo) {
      throw new NotFoundException("Módulo no encontrado");
    }

    const lecciones = await this.prisma.leccion.findMany({
      where: { moduloId, estaPublicada: true },
      orderBy: { orden: "asc" },
      include: { recursos: { orderBy: { orden: "asc" } } },
    });

    const inscripcion = await this.prisma.inscripcion.findFirst({
      where: { moduloId, estudianteId },
    });

    if (!inscripcion) {
      return lecciones.map((leccion) => ({
        ...leccion,
        completada: false,
        bloqueada: !leccion.esVistaPrevia,
        motivoBloqueo: leccion.esVistaPrevia ? null : "no_inscrito",
      }));
    }

    const progresos = await this.prisma.progresoLeccion.findMany({
      where: { inscripcionId: inscripcion.id },
    });

    const progresoPorLeccion = new Map(progresos.map((p) => [p.leccionId, p]));

    return lecciones.map((leccion, index) => {
      const progreso = progresoPorLeccion.get(leccion.id);
      const completada = !!progreso?.completadoEn;

      if (leccion.esVistaPrevia) {
        return { ...leccion, completada, bloqueada: false, motivoBloqueo: null };
      }

      if (index === 0) {
        return { ...leccion, completada, bloqueada: false, motivoBloqueo: null };
      }

      if (!leccion.requiereLeccionAnteriorCompletada) {
        return { ...leccion, completada, bloqueada: false, motivoBloqueo: null };
      }

      const anterior = lecciones[index - 1];
      const progresoAnterior = progresoPorLeccion.get(anterior.id);
      const anteriorCompletada = !!progresoAnterior?.completadoEn;

      return {
        ...leccion,
        completada,
        bloqueada: !anteriorCompletada,
        motivoBloqueo: anteriorCompletada ? null : "leccion_anterior_pendiente",
      };
    });
  }

  async findOne(id: string, estudianteId?: string, esAdmin = false) {
    const leccion = await this.prisma.leccion.findUnique({
      where: { id },
      include: {
        recursos: { orderBy: { orden: "asc" } },
        modulo: { select: { id: true, nombre: true, cursoId: true } },
      },
    });

    if (!leccion) {
      throw new NotFoundException("Lección no encontrada");
    }

    if (esAdmin || !estudianteId) {
      return { ...leccion, bloqueada: false, motivoBloqueo: null };
    }

    const acceso = await this.verificarAcceso(leccion, estudianteId);

    if (!acceso.puedeAcceder) {
      return {
        ...leccion,
        contenidoHtml: null,
        urlVideo: null,
        proveedorVideo: null,
        recursos: [],
        bloqueada: true,
        motivoBloqueo: acceso.motivo,
      };
    }

    return { ...leccion, bloqueada: false, motivoBloqueo: null };
  }

  private async verificarAcceso(
    leccion: { id: string; moduloId: string; esVistaPrevia: boolean; requiereLeccionAnteriorCompletada: boolean },
    estudianteId: string,
  ): Promise<{ puedeAcceder: boolean; motivo: "no_inscrito" | "leccion_anterior_pendiente" | null }> {
    if (leccion.esVistaPrevia) {
      return { puedeAcceder: true, motivo: null };
    }

    const inscripcion = await this.prisma.inscripcion.findFirst({
      where: { moduloId: leccion.moduloId, estudianteId },
    });

    if (!inscripcion) {
      return { puedeAcceder: false, motivo: "no_inscrito" };
    }

    if (leccion.requiereLeccionAnteriorCompletada) {
      const lecciones = await this.prisma.leccion.findMany({
        where: { moduloId: leccion.moduloId, estaPublicada: true },
        orderBy: { orden: "asc" },
      });

      const index = lecciones.findIndex((l) => l.id === leccion.id);

      if (index > 0) {
        const anterior = lecciones[index - 1];
        const progresoAnterior = await this.prisma.progresoLeccion.findUnique({
          where: { inscripcionId_leccionId: { inscripcionId: inscripcion.id, leccionId: anterior.id } },
        });

        if (!progresoAnterior?.completadoEn) {
          return { puedeAcceder: false, motivo: "leccion_anterior_pendiente" };
        }
      }
    }

    return { puedeAcceder: true, motivo: null };
  }


  async update(id: string, dto: UpdateLeccionDto) {
    const leccion = await this.findOne(id);

    if (dto.orden !== undefined && dto.orden !== leccion.orden) {
      return this.prisma.$transaction(async (tx) => {
        const total = await tx.leccion.count({ where: { moduloId: leccion.moduloId } });
        const nuevoOrden = Math.min(Math.max(dto.orden!, 1), total);
        if (nuevoOrden > leccion.orden) {
          await tx.leccion.updateMany({
            where: { moduloId: leccion.moduloId, orden: { gt: leccion.orden, lte: nuevoOrden } },
            data: { orden: { decrement: 1 } },
          });
        } else {
          await tx.leccion.updateMany({
            where: { moduloId: leccion.moduloId, orden: { gte: nuevoOrden, lt: leccion.orden } },
            data: { orden: { increment: 1 } },
          });
        }
        return tx.leccion.update({ where: { id }, data: { ...dto, orden: nuevoOrden } });
      });
    }
    return this.prisma.leccion.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.leccion.update({ where: { id }, data: { estaPublicada: false } });
  }

  async restore(id: string) {
    await this.findOne(id);
    return this.prisma.leccion.update({ where: { id }, data: { estaPublicada: true } });
  }


  async findFormularioPublico(leccionId: string) {
    const formulario = await this.prisma.formularioLeccion.findUnique({
      where: { leccionId },
      include: {
        preguntas: {
          orderBy: { orden: "asc" },
          select: {
            id: true,
            enunciado: true,
            tipoPregunta: true,
            orden: true,
            opciones: {
              orderBy: { orden: "asc" },
              select: { id: true, texto: true, orden: true },
            },
          },
        },
      },
    });

    return formulario;
  }

  async marcarCompletada(
    leccionId: string,
    estudianteId: string,
    respuestas?: { preguntaFormularioId: string; opcionFormularioId: string }[],
  ) {
    const leccion = await this.prisma.leccion.findUnique({
      where: { id: leccionId },
      include: { formulario: { include: { preguntas: { include: { opciones: true } } } } },
    });

    if (!leccion) {
      throw new NotFoundException("Lección no encontrada");
    }

    const inscripcion = await this.prisma.inscripcion.findFirst({
      where: { moduloId: leccion.moduloId, estudianteId },
    });

    if (!inscripcion) {
      throw new ForbiddenException({
        message: "No tienes una inscripción activa en este módulo",
        error: "no_inscrito",
      });
    }


    const lecciones = await this.prisma.leccion.findMany({
      where: { moduloId: leccion.moduloId, estaPublicada: true },
      orderBy: { orden: "asc" },
    });
    const index = lecciones.findIndex((l) => l.id === leccionId);

    if (index > 0 && leccion.requiereLeccionAnteriorCompletada) {
      const anterior = lecciones[index - 1];
      const progresoAnterior = await this.prisma.progresoLeccion.findUnique({
        where: { inscripcionId_leccionId: { inscripcionId: inscripcion.id, leccionId: anterior.id } },
      });

      if (!progresoAnterior?.completadoEn) {
        throw new BadRequestException({
          message: "Debes completar la lección anterior primero",
          error: "leccion_anterior_pendiente",
        });
      }
    }

    const progreso = await this.prisma.progresoLeccion.upsert({
      where: { inscripcionId_leccionId: { inscripcionId: inscripcion.id, leccionId } },
      update: {},
      create: {
        inscripcionId: inscripcion.id,
        leccionId,
        estado: "en_progreso",
        iniciadoEn: new Date(),
        desbloqueadoEn: new Date(),
      },
    });

    if (leccion.formulario) {
      const preguntas = leccion.formulario.preguntas;

      if (!respuestas || respuestas.length !== preguntas.length) {
        throw new BadRequestException("Debes responder todas las preguntas del checkpoint");
      }

      let todasCorrectas = true;
      const filas = respuestas.map((r) => {
        const pregunta = preguntas.find((p) => p.id === r.preguntaFormularioId);
        if (!pregunta) throw new BadRequestException("Pregunta inválida para esta lección");

        const opcion = pregunta.opciones.find((o) => o.id === r.opcionFormularioId);
        if (!opcion) throw new BadRequestException("Opción inválida para esta pregunta");

        if (!opcion.esCorrecta) todasCorrectas = false;

        return {
          progresoLeccionId: progreso.id,
          preguntaFormularioId: pregunta.id,
          opcionFormularioId: opcion.id,
          esCorrecta: opcion.esCorrecta,
        };
      });

      await this.prisma.respuestaFormulario.deleteMany({ where: { progresoLeccionId: progreso.id } });
      await this.prisma.respuestaFormulario.createMany({ data: filas });

      if (!todasCorrectas) {
        throw new BadRequestException("Alguna respuesta es incorrecta. Vuelve a intentarlo.");
      }
    }

    const progresoActualizado =
      await this.prisma.progresoLeccion.update({
        where: {
          id: progreso.id,
        },
        data: {
          estado: "completada",
          porcentaje: 100,
          completadoEn: new Date(),
          ultimoAccesoEn: new Date(),
        },
      });

    const progresoModuloResultado = await this.progresoService.recalcularProgresoModulo(
      inscripcion.id,
    );

    return {
      ...progresoActualizado,
      moduloCompletado: progresoModuloResultado.transicionACompletado ?? false,
      cursoCompletado: progresoModuloResultado.cursoCompleto ?? false,
    };
  }
}