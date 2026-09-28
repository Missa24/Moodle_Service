import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListarCertificadosDto } from './dto/listar-certificados.dto';
import * as crypto from 'crypto';
import { CertificadoPdfService } from './certificado-pdf.service';
import {
  CertificadoCursoPdfData,
  CertificadoPdfData,
} from './types/certificado-pdf-data';
import { Prisma } from '@prisma/client';

type CertificadoConRelaciones = Prisma.CertificadoGetPayload<{
  include: {
    curso: {
      select: {
        id: true;
        nombre: true;
      };
    };
    inscripcion: {
      select: {
        id: true;
        modulo: {
          select: {
            id: true;
            nombre: true;
            cursoId: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class CertificadoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly certificadoPdfService: CertificadoPdfService,
  ) { }

  private async generarCodigoVerificacion(): Promise<string> {
    while (true) {
      const numero = crypto
        .randomInt(100000, 1000000)
        .toString();

      const codigo = `ELT-${numero}`;

      const existente =
        await this.prisma.certificado.findUnique({
          where: {
            codigoVerificacion: codigo,
          },
        });

      if (!existente) {
        return codigo;
      }
    }
  }

  private generarNumeroCertificado(): string {
    const año = new Date().getFullYear();

    return `ELT-${año}-${Date.now()}`;
  }

  async findAll(query: ListarCertificadosDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const buscar = query.buscar?.trim();

    const skip = (page - 1) * limit;

    const where: Prisma.CertificadoWhereInput =
      buscar
        ? {
          OR: [
            {
              nombreCertificado: {
                contains: buscar,
                mode: 'insensitive',
              },
            },
            {
              titulo: {
                contains: buscar,
                mode: 'insensitive',
              },
            },
            {
              numeroCertificado: {
                contains: buscar,
                mode: 'insensitive',
              },
            },
            {
              codigoVerificacion: {
                contains: buscar,
                mode: 'insensitive',
              },
            },
            {
              usuario: {
                username: {
                  contains: buscar,
                  mode: 'insensitive',
                },
              },
            },
            {
              usuario: {
                correo: {
                  contains: buscar,
                  mode: 'insensitive',
                },
              },
            },
            {
              usuario: {
                perfil: {
                  nombre: {
                    contains: buscar,
                    mode: 'insensitive',
                  },
                },
              },
            },
            {
              usuario: {
                perfil: {
                  apellidoPaterno: {
                    contains: buscar,
                    mode: 'insensitive',
                  },
                },
              },
            },
            {
              usuario: {
                perfil: {
                  apellidoMaterno: {
                    contains: buscar,
                    mode: 'insensitive',
                  },
                },
              },
            },
            {
              curso: {
                nombre: {
                  contains: buscar,
                  mode: 'insensitive',
                },
              },
            },
            {
              inscripcion: {
                modulo: {
                  nombre: {
                    contains: buscar,
                    mode: 'insensitive',
                  },
                },
              },
            },
          ],
        }
        : {};

    const [certificados, total] =
      await Promise.all([
        this.prisma.certificado.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            fechaEmision: 'desc',
          },
          include: {
            usuario: {
              select: {
                id: true,
                username: true,
                correo: true,
                perfil: {
                  select: {
                    nombre: true,
                    apellidoPaterno: true,
                    apellidoMaterno: true,
                  },
                },
              },
            },
            curso: {
              select: {
                id: true,
                nombre: true,
                slug: true,
              },
            },
            inscripcion: {
              select: {
                id: true,
                numeroInscripcion: true,
                fechaInscripcion: true,
                estado: true,
                porcentajeAvance: true,
                modulo: {
                  select: {
                    id: true,
                    nombre: true,
                    cursoId: true,
                  },
                },
              },
            },
          },
        }),

        this.prisma.certificado.count({
          where,
        }),
      ]);

    const totalPages =
      Math.ceil(total / limit);

    return {
      data: certificados,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: string) {
    const certificado =
      await this.prisma.certificado.findUnique({
        where: {
          id,
        },
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              correo: true,
              perfil: {
                select: {
                  nombre: true,
                  apellidoPaterno: true,
                  apellidoMaterno: true,
                },
              },
            },
          },
          curso: {
            select: {
              id: true,
              nombre: true,
              slug: true,
            },
          },
          inscripcion: {
            select: {
              id: true,
              numeroInscripcion: true,
              fechaInscripcion: true,
              estado: true,
              porcentajeAvance: true,
              modulo: {
                select: {
                  id: true,
                  nombre: true,
                  cursoId: true,
                },
              },
            },
          },
        },
      });

    if (!certificado) {
      throw new NotFoundException(
        `No se encontró el certificado con ID: ${id}`,
      );
    }

    return certificado;
  }

  async buscarPorUsuario(usuarioId: string) {
    return this.prisma.certificado.findMany({
      where: {
        usuarioId,
      },
      orderBy: {
        fechaEmision: 'desc',
      },
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            correo: true,
            perfil: {
              select: {
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
              },
            },
          },
        },
        curso: {
          select: {
            id: true,
            nombre: true,
            slug: true,
          },
        },
        inscripcion: {
          select: {
            id: true,
            numeroInscripcion: true,
            fechaInscripcion: true,
            estado: true,
            porcentajeAvance: true,
            modulo: {
              select: {
                id: true,
                nombre: true,
                cursoId: true,
              },
            },
          },
        },
      },
    });
  }

  async buscarPorCodigo(codigo: string) {
    const certificado =
      await this.prisma.certificado.findUnique({
        where: {
          codigoVerificacion: codigo,
        },
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
            },
          },
          curso: {
            select: {
              id: true,
              nombre: true,
              slug: true,
            },
          },
          inscripcion: {
            select: {
              id: true,
              numeroInscripcion: true,
              estado: true,
              porcentajeAvance: true,
              modulo: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      });

    if (!certificado) {
      throw new NotFoundException(
        `No se encontró el certificado con código: ${codigo}`,
      );
    }

    return certificado;
  }

  async buscarPorCurso(cursoId: string) {
    return this.prisma.certificado.findMany({
      where: {
        cursoId,
      },
      orderBy: {
        fechaEmision: 'desc',
      },
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            correo: true,
            perfil: {
              select: {
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
              },
            },
          },
        },
        curso: {
          select: {
            id: true,
            nombre: true,
            slug: true,
          },
        },
        inscripcion: {
          select: {
            id: true,
            numeroInscripcion: true,
            estado: true,
            porcentajeAvance: true,
          },
        },
      },
    });
  }

  async buscarPorInscripcion(
    inscripcionId: string,
  ) {
    const certificado =
      await this.prisma.certificado.findUnique({
        where: {
          inscripcionId,
        },
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              correo: true,
              perfil: {
                select: {
                  nombre: true,
                  apellidoPaterno: true,
                  apellidoMaterno: true,
                },
              },
            },
          },
          inscripcion: {
            select: {
              id: true,
              numeroInscripcion: true,
              estado: true,
              porcentajeAvance: true,
              fechaInscripcion: true,
              fechaFinalizacion: true,
              modulo: {
                select: {
                  id: true,
                  nombre: true,
                  cursoId: true,
                },
              },
            },
          },
          curso: {
            select: {
              id: true,
              nombre: true,
              slug: true,
            },
          },
        },
      });

    if (!certificado) {
      throw new NotFoundException(
        `No se encontró el certificado para la inscripción: ${inscripcionId}`,
      );
    }

    return certificado;
  }

  async anularCertificado(
    id: string,
    motivoAnulacion: string,
  ) {
    const motivo =
      motivoAnulacion?.trim();

    if (!motivo) {
      throw new BadRequestException(
        'El motivo de anulación es obligatorio',
      );
    }

    const certificado =
      await this.prisma.certificado.findUnique({
        where: {
          id,
        },
      });

    if (!certificado) {
      throw new NotFoundException(
        `No se encontró el certificado con ID: ${id}`,
      );
    }

    if (certificado.estado === 'anulado') {
      throw new BadRequestException(
        'El certificado ya se encuentra anulado',
      );
    }

    return this.prisma.certificado.update({
      where: {
        id,
      },
      data: {
        estado: 'anulado',
        anuladoEn: new Date(),
        motivoAnulacion: motivo,
      },
    });
  }

  async consultarEstado(id: string) {
    const certificado =
      await this.prisma.certificado.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          numeroCertificado: true,
          codigoVerificacion: true,
          titulo: true,
          tipo: true,
          estado: true,
          fechaEmision: true,
          anuladoEn: true,
          motivoAnulacion: true,
        },
      });

    if (!certificado) {
      throw new NotFoundException(
        `No se encontró el certificado con ID: ${id}`,
      );
    }

    return {
      id: certificado.id,
      numeroCertificado:
        certificado.numeroCertificado,
      codigoVerificacion:
        certificado.codigoVerificacion,
      titulo: certificado.titulo,
      tipo: certificado.tipo,
      estado: certificado.estado,
      fechaEmision:
        certificado.fechaEmision,
      anuladoEn: certificado.anuladoEn,
      motivoAnulacion:
        certificado.motivoAnulacion,
    };
  }

  async imprimirCertificado(id: string) {
    const certificado =
      await this.prisma.certificado.findUnique({
        where: {
          id,
        },
      });

    if (!certificado) {
      throw new NotFoundException(
        `No se encontró el certificado con ID: ${id}`,
      );
    }

    if (certificado.estado === 'anulado') {
      throw new BadRequestException(
        'No se puede imprimir un certificado anulado',
      );
    }

    const certificadoActualizado =
      await this.prisma.certificado.update({
        where: {
          id,
        },
        data: {
          intentos: {
            increment: 1,
          },
        },
      });

    return {
      success: true,
      message:
        'Certificado autorizado para impresión',
      data: {
        id: certificadoActualizado.id,
        numeroCertificado:
          certificadoActualizado.numeroCertificado,
        titulo:
          certificadoActualizado.titulo,
        estado:
          certificadoActualizado.estado,
        intentos:
          Number(certificadoActualizado.intentos),
        rutaPdf:
          certificadoActualizado.rutaPdf,
      },
    };
  }

  async emitirCertificadoModulo(
    inscripcionId: string,
    usuarioId: string,
    nombreCertificado: string,
  ) {
    const nombre =
      nombreCertificado?.trim();

    if (!nombre) {
      throw new BadRequestException(
        'El nombre para el certificado es obligatorio',
      );
    }

    const inscripcion =
      await this.prisma.inscripcion.findUnique({
        where: {
          id: inscripcionId,
        },
        include: {
          estudiante: {
            include: {
              perfil: true,
            },
          },
          modulo: {
            include: {
              curso: true,
            },
          },
          progresoModulo: true,
        },
      });

    if (!inscripcion) {
      throw new NotFoundException(
        'Inscripción no encontrada',
      );
    }

    if (
      inscripcion.estudianteId !==
      usuarioId
    ) {
      throw new BadRequestException(
        'No puedes emitir el certificado de otra persona',
      );
    }

    if (
      !inscripcion.modulo
        .otorgaCertificacion
    ) {
      throw new BadRequestException(
        'Este módulo no otorga certificado',
      );
    }

    if (
      inscripcion.progresoModulo?.estado !==
      'completado'
    ) {
      throw new BadRequestException(
        'El módulo todavía no ha sido completado',
      );
    }

    const certificadoExistente =
      await this.prisma.certificado.findUnique({
        where: {
          inscripcionId,
        },
      });

    if (certificadoExistente) {
      return certificadoExistente;
    }

    const codigoVerificacion =
      await this.generarCodigoVerificacion();

    const numeroCertificado =
      this.generarNumeroCertificado();

    const frontendUrl =
      process.env.FRONTEND_URL;

    const certificado =
      await this.prisma.certificado.create({
        data: {
          tipo: 'modulo',
          usuarioId:
            inscripcion.estudianteId,
          inscripcionId:
            inscripcion.id,
          cursoId: null,

          codigoVerificacion,
          numeroCertificado,

          nombreCertificado:
            nombre,

          titulo:
            `Certificado de participación - ${inscripcion.modulo.nombre}`,

          fechaEmision: new Date(),

          estado: 'emitido',

          urlVerificacion:
            `${frontendUrl}/verificar/${codigoVerificacion}`,
        },
      });

    return {
      id: certificado.id,
      tipo: certificado.tipo,
      nombre:
        certificado.nombreCertificado,

      modulo:
        inscripcion.modulo.nombre,

      curso:
        inscripcion.modulo.curso.nombre,

      fecha:
        certificado.fechaEmision,

      codigoVerificacion:
        certificado.codigoVerificacion,

      numeroCertificado:
        certificado.numeroCertificado,

      urlVerificacion:
        certificado.urlVerificacion,

      titulo:
        certificado.titulo,
    };
  }

  async verificarYEmitirCertificadoCurso(
    estudianteId: string,
    cursoId: string,
    nombreCertificado: string,
  ) {
    const nombre =
      nombreCertificado?.trim();

    if (!nombre) {
      throw new BadRequestException(
        'El nombre para el certificado es obligatorio',
      );
    }

    const curso =
      await this.prisma.curso.findUnique({
        where: {
          id: cursoId,
        },
        include: {
          reglaCertificacion: true,
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'Curso no encontrado',
      );
    }

    const progresoCurso =
      await this.prisma.progresoCurso.findUnique({
        where: {
          cursoId_estudianteId: {
            cursoId,
            estudianteId,
          },
        },
      });

    if (!progresoCurso) {
      throw new BadRequestException(
        'No existe progreso para este curso',
      );
    }

    const porcentajeRequerido =
      curso.reglaCertificacion
        ?.porcentajeModulosRequerido ??
      100;

    if (
      progresoCurso.porcentaje <
      porcentajeRequerido
    ) {
      throw new BadRequestException(
        `El curso todavía no cumple el porcentaje requerido para obtener el certificado (${porcentajeRequerido}%)`,
      );
    }

    const certificadoExistente =
      await this.prisma.certificado.findFirst({
        where: {
          usuarioId: estudianteId,
          cursoId,
          tipo: 'curso',
        },
      });

    if (certificadoExistente) {
      return certificadoExistente;
    }

    const codigoVerificacion =
      await this.generarCodigoVerificacion();

    const numeroCertificado =
      this.generarNumeroCertificado();

    const frontendUrl =
      process.env.FRONTEND_URL;

    return this.prisma.certificado.create({
      data: {
        tipo: 'curso',
        usuarioId: estudianteId,
        inscripcionId: null,
        cursoId,

        codigoVerificacion,
        numeroCertificado,

        nombreCertificado:
          nombre,

        titulo:
          'Certificado de aprobación del curso',

        fechaEmision: new Date(),

        estado: 'emitido',

        urlVerificacion:
          `${frontendUrl}/verificar/${codigoVerificacion}`,
      },
    });
  }

  async descargarCertificado(id: string) {
    const certificado =
      await this.prisma.certificado.findUnique({
        where: {
          id,
        },
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              correo: true,
            },
          },
          curso: {
            select: {
              id: true,
              nombre: true,
              slug: true,
              duracionHoras: true,
            },
          },
          inscripcion: {
            select: {
              id: true,
              numeroInscripcion: true,
              fechaInscripcion: true,
              fechaFinalizacion: true,
              estado: true,
              porcentajeAvance: true,
              modulo: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      });

    if (!certificado) {
      throw new NotFoundException(
        `No se encontró el certificado con ID: ${id}`,
      );
    }

    if (
      certificado.estado ===
      'anulado'
    ) {
      throw new BadRequestException(
        'No se puede descargar un certificado anulado',
      );
    }

    const nombre =
      certificado.nombreCertificado;

    let pdfData:
      | CertificadoPdfData
      | CertificadoCursoPdfData;

    if (
      certificado.tipo ===
      'modulo'
    ) {
      pdfData = {
        id: certificado.id,
        tipo: 'modulo',
        nombre,

        modulo:
          certificado.inscripcion
            ?.modulo?.nombre ?? '',

        curso:
          certificado.curso
            ?.nombre ?? '',

        fecha:
          certificado.fechaEmision,

        codigoVerificacion:
          certificado.codigoVerificacion,

        numeroCertificado:
          certificado.numeroCertificado,

        urlVerificacion:
          certificado.urlVerificacion ??
          '',

        titulo:
          certificado.titulo,
      };
    } else {
      const resumen =
        await this.construirResumenCurso(
          certificado.usuarioId,
          certificado.cursoId,
        );

      pdfData = {
        id: certificado.id,
        tipo: 'curso',
        nombre,

        curso:
          certificado.curso
            ?.nombre ?? '',

        fecha:
          certificado.fechaEmision,

        codigoVerificacion:
          certificado.codigoVerificacion,

        numeroCertificado:
          certificado.numeroCertificado,

        urlVerificacion:
          certificado.urlVerificacion ??
          '',

        titulo:
          certificado.curso
            ?.nombre ?? '',

        resumen,

        cargaHoraria:
          certificado.curso
            ?.duracionHoras
            ?.toString() ?? '',
      };
    }

    const buffer =
      await this.certificadoPdfService.generarPdf(
        pdfData,
      );

    return {
      buffer,
      filename:
        `certificado-${certificado.numeroCertificado}.pdf`,
    };
  }

  async obtenerCertificadosPorUsuario(
    usuarioId: string,
    buscar?: string,
  ) {
    const busqueda =
      buscar?.trim();

    const usuario =
      await this.prisma.usuario.findUnique({
        where: {
          id: usuarioId,
        },
        select: {
          perfil: {
            select: {
              nombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true,
            },
          },
        },
      });

    const nombreSugerido =
      usuario?.perfil
        ? [
          usuario.perfil.nombre,
          usuario.perfil.apellidoPaterno,
          usuario.perfil.apellidoMaterno,
        ]
          .filter(Boolean)
          .join(' ')
          .trim()
        : '';

    const certificados =
      await this.prisma.certificado.findMany({
        where: {
          usuarioId,

          ...(busqueda
            ? {
              OR: [
                {
                  titulo: {
                    contains: busqueda,
                    mode: 'insensitive',
                  },
                },
                {
                  nombreCertificado: {
                    contains: busqueda,
                    mode: 'insensitive',
                  },
                },
              ],
            }
            : {}),
        },

        orderBy: {
          fechaEmision: 'desc',
        },

        include: {
          curso: {
            select: {
              id: true,
              nombre: true,
            },
          },

          inscripcion: {
            select: {
              id: true,
              modulo: {
                select: {
                  id: true,
                  nombre: true,
                  cursoId: true,
                },
              },
            },
          },
        },
      });

    const certificadosMapeados =
      await Promise.all(
        certificados.map(
          (certificado) =>
            this.mapearCertificadoResumen(
              certificado,
            ),
        ),
      );

    const inscripcionesPendientes =
      await this.prisma.inscripcion.findMany({
        where: {
          estudianteId: usuarioId,

          modulo: {
            otorgaCertificacion: true,

            ...(busqueda
              ? {
                nombre: {
                  contains: busqueda,
                  mode: 'insensitive',
                },
              }
              : {}),
          },

          progresoModulo: {
            estado: 'completado',
          },

          certificado: null,
        },

        select: {
          id: true,

          modulo: {
            select: {
              id: true,
              nombre: true,
              cursoId: true,

              curso: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      });

    const modulosPendientes =
      inscripcionesPendientes.map(
        (inscripcion) => ({
          idCertificado: null,

          idInscripcion:
            inscripcion.id,

          idModulo:
            inscripcion.modulo.id,

          idUsuario:
            usuarioId,

          idCurso:
            inscripcion.modulo.cursoId,

          nombre:
            inscripcion.modulo.nombre,

          nombreCertificado:
            null,

          nombreSugerido:
            nombreSugerido || null,

          descripcion:
            `Certificado de participación otorgado por haber completado el módulo de ${inscripcion.modulo.nombre}.`,

          tipo: 'modulo',

          estado:
            'pendiente_emision',

          fechaEmision: null,

          numeroCertificado: null,
        }),
      );

    const progresosCursos =
      await this.prisma.progresoCurso.findMany({
        where: {
          estudianteId: usuarioId,
        },

        select: {
          cursoId: true,
          porcentaje: true,

          curso: {
            select: {
              id: true,
              nombre: true,

              reglaCertificacion: {
                select: {
                  porcentajeModulosRequerido: true,
                  estado: true,
                },
              },
            },
          },
        },
      });

    const certificadosCursos =
      await this.prisma.certificado.findMany({
        where: {
          usuarioId,
          tipo: 'curso',
        },

        select: {
          cursoId: true,
        },
      });

    const cursosConCertificado =
      new Set(
        certificadosCursos
          .map(
            (certificado) =>
              certificado.cursoId,
          )
          .filter(
            (
              cursoId,
            ): cursoId is string =>
              cursoId !== null,
          ),
      );

    const cursosPendientes =
      progresosCursos
        .filter((progreso) => {
          const regla =
            progreso.curso
              .reglaCertificacion;

          const porcentajeRequerido =
            regla
              ?.porcentajeModulosRequerido ??
            100;

          const reglaActiva =
            !regla ||
            regla.estado ===
            'activa';

          const cumple =
            progreso.porcentaje >=
            porcentajeRequerido;

          const noTieneCertificado =
            !cursosConCertificado.has(
              progreso.cursoId,
            );

          return (
            reglaActiva &&
            cumple &&
            noTieneCertificado
          );
        })

        .filter((progreso) => {
          if (!busqueda) {
            return true;
          }

          return progreso.curso.nombre
            .toLowerCase()
            .includes(
              busqueda.toLowerCase(),
            );
        })

        .map((progreso) => ({
          idCertificado: null,

          idInscripcion: null,

          idModulo: null,

          idUsuario:
            usuarioId,

          idCurso:
            progreso.cursoId,

          nombre:
            progreso.curso.nombre,

          nombreCertificado:
            null,

          nombreSugerido:
            nombreSugerido || null,

          descripcion:
            'Certificado otorgado por haber completado el curso.',

          tipo: 'curso',

          estado:
            'pendiente_emision',

          fechaEmision: null,

          numeroCertificado: null,
        }));

    return [
      ...modulosPendientes,
      ...cursosPendientes,
      ...certificadosMapeados,
    ];
  }

  private async mapearCertificadoResumen(
    certificado: CertificadoConRelaciones,
  ) {
    const esModulo =
      certificado.tipo === 'modulo';

    const nombre =
      esModulo
        ? certificado.inscripcion
          ?.modulo?.nombre ?? ''
        : certificado.curso
          ?.nombre ?? '';

    const cursoId =
      certificado.curso?.id ??
      certificado.inscripcion
        ?.modulo?.cursoId ??
      null;

    const descripcion =
      esModulo
        ? `Certificado de participación otorgado por haber completado el módulo de ${nombre}.`
        : await this.construirResumenCurso(
          certificado.usuarioId,
          cursoId,
        );

    return {
      idCertificado:
        certificado.id,

      idInscripcion:
        certificado.inscripcion?.id ??
        null,

      idModulo:
        certificado.inscripcion
          ?.modulo?.id ?? null,

      idUsuario:
        certificado.usuarioId,

      idCurso:
        cursoId,

      nombre,

      nombreCertificado:
        certificado.nombreCertificado,

      descripcion,

      tipo:
        certificado.tipo,

      estado:
        certificado.estado,

      fechaEmision:
        certificado.fechaEmision,

      numeroCertificado:
        certificado.numeroCertificado,
    };
  }

  private async construirResumenCurso(
    usuarioId: string,
    cursoId: string | null,
  ): Promise<string> {
    if (!cursoId) {
      return 'Se otorga al estudiante por la finalización del curso.';
    }

    const inscripciones =
      await this.prisma.inscripcion.findMany({
        where: {
          estudianteId: usuarioId,

          modulo: {
            cursoId,
          },

          progresoModulo: {
            estado: 'completado',
          },
        },

        select: {
          modulo: {
            select: {
              nombre: true,
            },
          },
        },
      });

    const nombresModulos =
      inscripciones.map(
        (inscripcion) =>
          inscripcion.modulo.nombre,
      );

    if (
      nombresModulos.length === 0
    ) {
      return 'Se otorga al estudiante por la finalización del curso.';
    }

    if (
      nombresModulos.length === 1
    ) {
      return `Se otorga al estudiante por haber cursado el módulo de ${nombresModulos[0]}.`;
    }

    const ultimo =
      nombresModulos[
      nombresModulos.length - 1
      ];

    const resto =
      nombresModulos
        .slice(0, -1)
        .join(', ');

    return `Se otorga al estudiante por haber cursado los módulos de ${resto} y ${ultimo}.`;
  }

  async verificarPorCodigo(
    codigo: string,
  ) {
    const certificado =
      await this.prisma.certificado.findUnique({
        where: {
          codigoVerificacion: codigo,
        },

        include: {
          usuario: {
            select: {
              id: true,
              username: true,
            },
          },

          curso: {
            select: {
              id: true,
              nombre: true,
              slug: true,
            },
          },

          inscripcion: {
            select: {
              id: true,
              numeroInscripcion: true,
              estado: true,
              porcentajeAvance: true,
              fechaInscripcion: true,
              fechaFinalizacion: true,

              modulo: {
                select: {
                  id: true,
                  nombre: true,
                  cursoId: true,

                  curso: {
                    select: {
                      id: true,
                      nombre: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!certificado) {
      throw new NotFoundException(
        'El certificado no existe o el código de verificación no es válido',
      );
    }

    const curso =
      certificado.curso ??
      certificado.inscripcion
        ?.modulo?.curso ??
      null;

    return {
      valido:
        certificado.estado ===
        'emitido',

      certificado: {
        id:
          certificado.id,

        codigoVerificacion:
          certificado.codigoVerificacion,

        numeroCertificado:
          certificado.numeroCertificado,

        titulo:
          certificado.titulo,

        tipo:
          certificado.tipo,

        estado:
          certificado.estado,

        fechaEmision:
          certificado.fechaEmision,

        estudiante: {
          nombreCompleto:
            certificado.nombreCertificado,

          nombre: null,

          apellidoPaterno: null,

          apellidoMaterno: null,

          tipoDocumentoIdentidad:
            null,

          numeroDocumento:
            null,
        },

        curso,

        modulo:
          certificado.inscripcion
            ?.modulo
            ? {
              id:
                certificado.inscripcion
                  .modulo.id,

              nombre:
                certificado.inscripcion
                  .modulo.nombre,

              cursoId:
                certificado.inscripcion
                  .modulo.cursoId,
            }
            : null,

        inscripcion:
          certificado.inscripcion
            ? {
              numeroInscripcion:
                certificado.inscripcion
                  .numeroInscripcion,

              fechaInscripcion:
                certificado.inscripcion
                  .fechaInscripcion,

              fechaFinalizacion:
                certificado.inscripcion
                  .fechaFinalizacion,
            }
            : null,
      },
    };
  }
  async actualizarNombreCertificado(
    id: string,
    nombreCertificado: string,
  ) {
    const nombre = nombreCertificado?.trim();

    if (!nombre) {
      throw new BadRequestException(
        'El nombre para el certificado es obligatorio',
      );
    }

    const certificado =
      await this.prisma.certificado.findUnique({
        where: { id },
      });

    if (!certificado) {
      throw new NotFoundException(
        `No se encontró el certificado con ID: ${id}`,
      );
    }

    if (certificado.estado === 'anulado') {
      throw new BadRequestException(
        'No se puede modificar un certificado anulado',
      );
    }

    return this.prisma.certificado.update({
      where: { id },
      data: {
        nombreCertificado: nombre,
      },
    });
  }
}