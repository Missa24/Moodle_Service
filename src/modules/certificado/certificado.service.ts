import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListarCertificadosDto } from './dto/listar-certificados.dto';
import * as crypto from 'crypto';
import { CertificadoPdfService } from './certificado-pdf.service';
import { CertificadoCursoPdfData, CertificadoPdfData } from './types/certificado-pdf-data';
import { Prisma } from '@prisma/client';

const MAX_INTENTOS_IMPRESION = 10;

type CertificadoConRelaciones = Prisma.CertificadoGetPayload<{
  include: {
    curso: { select: { id: true; nombre: true } };
    inscripcion: {
      select: {
        id: true;
        modulo: { select: { id: true; nombre: true; cursoId: true } };
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

      const existente = await this.prisma.certificado.findUnique({
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

    const where = buscar
      ? {
        titulo: {
          contains: buscar,
          mode: 'insensitive' as const,
        },
      }
      : {};

    const [certificados, total] = await Promise.all([
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

    const totalPages = Math.ceil(total / limit);

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
    const certificado = await this.prisma.certificado.findUnique({
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
      throw new NotFoundException(`No se encontró el certificado con ID: ${id}`);
    }

    return certificado;
  }

  async buscarPorUsuario(usuarioId: string) {
    const certificados = await this.prisma.certificado.findMany({
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

    return certificados;
  }

  async buscarPorCodigo(codigo: string) {
    const certificado = await this.prisma.certificado.findUnique({
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
      throw new NotFoundException(`No se encontró el certificado con código: ${codigo}`);
    }

    return certificado;
  }

  async buscarPorCurso(cursoId: string) {
    const certificados = await this.prisma.certificado.findMany({
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

    return certificados;
  }

  async buscarPorInscripcion(inscripcionId: string) {
    const certificado = await this.prisma.certificado.findUnique({
      where: {
        inscripcionId,
      },

      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            correo: true,
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
      throw new NotFoundException(`No se encontró el certificado para la inscripción: ${inscripcionId}`,);
    }

    return certificado;
  }

  async anularCertificado(id: string, motivoAnulacion: string,) {
    const certificado = await this.prisma.certificado.findUnique({
      where: {
        id,
      },
    });

    if (!certificado) {
      throw new NotFoundException(`No se encontró el certificado con ID: ${id}`,);
    }

    if (certificado.estado === 'anulado') {
      throw new BadRequestException('El certificado ya se encuentra anulado',);
    }

    const certificadoAnulado =
      await this.prisma.certificado.update({
        where: {
          id,
        },

        data: {
          estado: 'anulado',
          anuladoEn: new Date(),
          motivoAnulacion,
        },
      });

    return certificadoAnulado;
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
      throw new NotFoundException(`No se encontró el certificado con ID: ${id}`);
    }

    return {
      id: certificado.id,
      numeroCertificado: certificado.numeroCertificado,
      codigoVerificacion: certificado.codigoVerificacion,
      titulo: certificado.titulo,
      tipo: certificado.tipo,
      estado: certificado.estado,
      fechaEmision: certificado.fechaEmision,
      anuladoEn: certificado.anuladoEn,
      motivoAnulacion: certificado.motivoAnulacion,
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
      throw new NotFoundException(`No se encontró el certificado con ID: ${id}`);
    }

    if (certificado.estado === 'anulado') {
      throw new BadRequestException('No se puede imprimir un certificado anulado');
    }

    if (
      certificado.intentos >= MAX_INTENTOS_IMPRESION
    ) {
      throw new BadRequestException(`Se alcanzó el máximo de ${MAX_INTENTOS_IMPRESION} intentos de impresión`,);
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
      message: 'Certificado autorizado para impresión',

      data: {
        id: certificadoActualizado.id,
        numeroCertificado:
          certificadoActualizado.numeroCertificado,
        titulo: certificadoActualizado.titulo,
        estado: certificadoActualizado.estado,
        intentos: Number(
          certificadoActualizado.intentos,
        ),
        maximoIntentos: MAX_INTENTOS_IMPRESION,
        intentosRestantes: MAX_INTENTOS_IMPRESION - Number(certificadoActualizado.intentos),
        rutaPdf: certificadoActualizado.rutaPdf,
      },
    };
  }

  async emitirCertificadoModulo(
    inscripcionId: string,
  ) {
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
        },
      });

    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada');
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

    const frontendUrl = process.env.FRONTEND_URL;

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
        `${inscripcion.estudiante.perfil?.nombre ?? ''} ` +
        `${inscripcion.estudiante.perfil?.apellidoPaterno ?? ''} ` +
        `${inscripcion.estudiante.perfil?.apellidoMaterno ?? ''}`
          .trim(),

      modulo: inscripcion.modulo.nombre,

      curso: inscripcion.modulo.curso.nombre,

      fecha: certificado.fechaEmision,

      codigoVerificacion:
        certificado.codigoVerificacion,

      numeroCertificado:
        certificado.numeroCertificado,

      urlVerificacion:
        certificado.urlVerificacion,

      titulo: certificado.titulo,
    };
  }

  async verificarYEmitirCertificadoCurso(
    estudianteId: string,
    cursoId: string,
  ) {
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

    const codigoVerificacion = await this.generarCodigoVerificacion();

    const numeroCertificado = this.generarNumeroCertificado();

    return this.prisma.certificado.create({
      data: {
        tipo: 'curso',
        usuarioId: estudianteId,
        inscripcionId: null,
        cursoId,
        codigoVerificacion,
        numeroCertificado,
        titulo: 'Certificado de aprobación del curso',
        fechaEmision: new Date(),
        estado: 'emitido',
        urlVerificacion: `http://localhost:5173/verificar/${codigoVerificacion}`,
      },
    });
  }

  async descargarCertificado(id: string) {
    const certificado = await this.prisma.certificado.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true, username: true, correo: true,
            perfil: { select: { nombre: true, apellidoPaterno: true, apellidoMaterno: true, numeroDocumento: true } },
          },
        },
        curso: { select: { id: true, nombre: true, slug: true, duracionHoras: true } },
        inscripcion: {
          select: {
            id: true, numeroInscripcion: true, fechaInscripcion: true, fechaFinalizacion: true,
            estado: true, porcentajeAvance: true,
            modulo: { select: { id: true, nombre: true } },
          },
        },
      },
    });

    if (!certificado) {
      throw new NotFoundException(`No se encontró el certificado con ID: ${id}`);
    }

    if (certificado.estado === 'anulado') {
      throw new BadRequestException('No se puede descargar un certificado anulado');
    }

    const nombre = [
      certificado.usuario.perfil?.nombre,
      certificado.usuario.perfil?.apellidoPaterno,
      certificado.usuario.perfil?.apellidoMaterno,
    ].filter(Boolean).join(' ');

    let pdfData: CertificadoPdfData | CertificadoCursoPdfData;

    if (certificado.tipo === 'modulo') {
      pdfData = {
        id: certificado.id,
        tipo: 'modulo',
        nombre,
        modulo: certificado.inscripcion?.modulo?.nombre ?? '',
        curso: certificado.curso?.nombre ?? '',
        fecha: certificado.fechaEmision,
        codigoVerificacion: certificado.codigoVerificacion,
        numeroCertificado: certificado.numeroCertificado,
        urlVerificacion: certificado.urlVerificacion ?? '',
        titulo: certificado.titulo,
      };
    } else {
      const resumen = await this.construirResumenCurso(certificado.usuarioId, certificado.cursoId);

      pdfData = {
        id: certificado.id,
        tipo: 'curso',
        nombre,
        curso: certificado.curso?.nombre ?? '',
        fecha: certificado.fechaEmision,
        codigoVerificacion: certificado.codigoVerificacion,
        numeroCertificado: certificado.numeroCertificado,
        urlVerificacion: certificado.urlVerificacion ?? '',
        titulo: certificado.curso?.nombre ?? '',
        resumen: resumen,
        cargaHoraria: certificado.curso?.duracionHoras?.toString() ?? "",
      };
    }

    const buffer = await this.certificadoPdfService.generarPdf(pdfData);

    return {
      buffer,
      filename: `certificado-${certificado.numeroCertificado}.pdf`,
    };
  }

  async obtenerCertificadosPorUsuario(usuarioId: string, buscar?: string) {
    const busqueda = buscar?.trim();

    const where: Prisma.CertificadoWhereInput = {
      usuarioId,
      ...(busqueda
        ? { titulo: { contains: busqueda, mode: 'insensitive' as const } }
        : {}),
    };

    const certificados = await this.prisma.certificado.findMany({
      where,
      orderBy: { fechaEmision: 'desc' },
      include: {
        curso: { select: { id: true, nombre: true } },
        inscripcion: {
          select: {
            id: true,
            modulo: { select: { id: true, nombre: true, cursoId: true } },
          },
        },
      },
    });

    return Promise.all(
      certificados.map((certificado) => this.mapearCertificadoResumen(certificado)),
    );
  }

  private async mapearCertificadoResumen(certificado: CertificadoConRelaciones) {
    const esModulo = certificado.tipo === 'modulo';

    const nombre = esModulo
      ? certificado.inscripcion?.modulo?.nombre ?? ''
      : certificado.curso?.nombre ?? '';

    const cursoId =
      certificado.curso?.id ?? certificado.inscripcion?.modulo?.cursoId ?? null;

    const descripcion = esModulo
      ? `Certificado de participación otorgado por haber completado el módulo de ${nombre}.`
      : await this.construirResumenCurso(certificado.usuarioId, cursoId);

    return {
      idCertificado: certificado.id,
      idInscripcion: certificado.inscripcion?.id ?? null,
      idModulo: certificado.inscripcion?.modulo?.id ?? null,
      idUsuario: certificado.usuarioId,
      idCurso: cursoId,
      nombre,
      descripcion,
      tipo: certificado.tipo,
      estado: certificado.estado,
      fechaEmision: certificado.fechaEmision,
      numeroCertificado: certificado.numeroCertificado,
    };
  }

  private async construirResumenCurso(usuarioId: string, cursoId: string | null): Promise<string> {
    if (!cursoId) {
      return 'Se otorga al estudiante por la finalización del curso.';
    }

    const inscripciones = await this.prisma.inscripcion.findMany({
      where: {
        estudianteId: usuarioId,
        modulo: { cursoId },
        progresoModulo: { estado: 'completado' },
      },
      select: {
        modulo: { select: { nombre: true } },
      },
    });

    const nombresModulos = inscripciones.map((i) => i.modulo.nombre);

    if (nombresModulos.length === 0) {
      return 'Se otorga al estudiante por la finalización del curso.';
    }

    if (nombresModulos.length === 1) {
      return `Se otorga al estudiante por haber cursado el módulo de ${nombresModulos[0]}.`;
    }

    const ultimo = nombresModulos[nombresModulos.length - 1];
    const resto = nombresModulos.slice(0, -1).join(', ');

    return `Se otorga al estudiante por haber cursado los módulos de ${resto} y ${ultimo}.`;
  }

  async verificarPorCodigo(codigo: string) {
    const certificado = await this.prisma.certificado.findUnique({
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
                cursoId: true,
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

    return {
      valido: certificado.estado === 'emitido',
      certificado: {
        id: certificado.id,
        codigoVerificacion: certificado.codigoVerificacion,
        numeroCertificado: certificado.numeroCertificado,
        titulo: certificado.titulo,
        tipo: certificado.tipo,
        estado: certificado.estado,
        fechaEmision: certificado.fechaEmision,
        usuario: certificado.usuario,
        curso: certificado.curso,
        modulo: certificado.inscripcion?.modulo ?? null,
      },
    };
  }

}
