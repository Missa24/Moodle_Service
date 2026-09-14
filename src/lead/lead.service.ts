import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EstadoLead,
  MedioPago,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { InscripcionesService } from 'src/modules/inscripcion/inscripciones.service';
import { VentasService } from 'src/ventas/ventas.service';


type DatosPagoLead = {
  medioPago?: MedioPago;
  moneda?: string;
  referenciaPago?: string;
  observaciones?: string;
};

@Injectable()
export class LeadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inscripcionesService: InscripcionesService,
    private readonly ventasService: VentasService,
  ) { }

  async create(usuarioId: string, moduloId: string) {
    const modulo = await this.prisma.modulo.findUnique({
      where: { id: moduloId },
    });

    if (!modulo) {
      throw new BadRequestException('El módulo indicado no existe');
    }

    const leadExistente = await this.prisma.lead.findUnique({
      where: {
        usuarioId_moduloId: {
          usuarioId,
          moduloId,
        },
      },
    });

    if (leadExistente) {
      await this.prisma.lead.update({
        where: { id: leadExistente.id },
        data: { ultimoIntentoEn: new Date() },
      });

      return { ok: true };
    }

    await this.prisma.lead.create({
      data: {
        usuarioId,
        moduloId,
      },
    });

    return { ok: true };
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    q: string = '',
  ) {
    const currentPage = Math.max(page, 1);
    const currentLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (currentPage - 1) * currentLimit;
    const search = q.trim();

    const where = search
      ? {
        OR: [
          {
            usuario: {
              correo: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          },
          {
            usuario: {
              perfil: {
                nombre: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
          {
            usuario: {
              perfil: {
                apellidoPaterno: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
          {
            usuario: {
              perfil: {
                apellidoMaterno: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
          {
            usuario: {
              perfil: {
                telefono: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
          {
            modulo: {
              nombre: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          },
          {
            modulo: {
              curso: {
                nombre: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
        ],
      }
      : {};

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: currentLimit,
        orderBy: {
          ultimoIntentoEn: 'desc',
        },
        select: {
          id: true,
          estado: true,
          creadoEn: true,
          actualizadoEn: true,
          ultimoIntentoEn: true,
          convertidoEn: true,
          usuario: {
            select: {
              id: true,
              correo: true,
              perfil: {
                select: {
                  nombre: true,
                  apellidoPaterno: true,
                  apellidoMaterno: true,
                  telefono: true,
                  ciudad: true,
                  pais: true,
                  paisCodigo: true,
                },
              },
            },
          },
          modulo: {
            select: {
              id: true,
              nombre: true,
              curso: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.lead.count({
        where,
      }),
    ]);

    const data = leads.map((lead) => ({
      id: lead.id,
      usuarioId: lead.usuario.id,
      nombre: lead.usuario.perfil?.nombre ?? '',
      apellidoPaterno: lead.usuario.perfil?.apellidoPaterno ?? '',
      apellidoMaterno: lead.usuario.perfil?.apellidoMaterno ?? '',
      correo: lead.usuario.correo,
      telefono: lead.usuario.perfil?.telefono ?? '',
      ciudad: lead.usuario.perfil?.ciudad ?? '',
      pais: lead.usuario.perfil?.pais ?? '',
      paisCodigo: lead.usuario.perfil?.paisCodigo ?? '',
      curso: {
        id: lead.modulo.curso.id,
        nombre: lead.modulo.curso.nombre,
      },
      modulo: {
        id: lead.modulo.id,
        nombre: lead.modulo.nombre,
      },
      estado: lead.estado,
      creadoEn: lead.creadoEn,
      actualizadoEn: lead.actualizadoEn,
      ultimoIntentoEn: lead.ultimoIntentoEn,
      convertidoEn: lead.convertidoEn,
    }));

    return {
      data,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages: Math.ceil(total / currentLimit),
      },
    };
  }

  async findByUser(usuarioId: string) {
    return this.prisma.lead.findMany({
      where: { usuarioId },
      orderBy: {
        ultimoIntentoEn: 'desc',
      },
      select: {
        id: true,
        estado: true,
        creadoEn: true,
        ultimoIntentoEn: true,
        convertidoEn: true,
        modulo: {
          select: {
            id: true,
            nombre: true,
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
  }

  async findById(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        creadoEn: true,
        actualizadoEn: true,
        ultimoIntentoEn: true,
        convertidoEn: true,
        usuario: {
          select: {
            id: true,
            correo: true,
            perfil: {
              select: {
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                telefono: true,
                ciudad: true,
                pais: true,
                paisCodigo: true,
              },
            },
          },
        },
        modulo: {
          select: {
            id: true,
            nombre: true,
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

    if (!lead) {
      throw new NotFoundException('Lead no encontrado');
    }

    return lead;
  }

  async updateEstado(
    id: string,
    estado: EstadoLead,
    datosPago?: DatosPagoLead,
  ) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        usuarioId: true,
        moduloId: true,
        estado: true,
        ventaModulo: {
          select: {
            id: true,
          },
        },
        modulo: {
          select: {
            id: true,
            nombre: true,
            curso: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead no encontrado');
    }

    if (estado === EstadoLead.PAGO_COMPLETADO) {
      if (!datosPago?.medioPago) {
        throw new BadRequestException(
          'Debes indicar el medio de pago para confirmar el pago',
        );
      }

      const estadoInscripcion =
        await this.inscripcionesService.verificarMiInscripcion(
          lead.usuarioId,
          lead.moduloId,
        );

      let nuevaInscripcion = false;

      if (!estadoInscripcion.inscrito) {
        await this.inscripcionesService.create({
          estudianteId: lead.usuarioId,
          moduloId: lead.moduloId,
        });

        nuevaInscripcion = true;
      }

      const inscripcion = await this.prisma.inscripcion.findFirst({
        where: {
          estudianteId: lead.usuarioId,
          moduloId: lead.moduloId,
        },
        orderBy: {
          creadoEn: 'desc',
        },
        select: {
          id: true,
        },
      });

      if (!inscripcion) {
        throw new BadRequestException(
          'No se pudo obtener la inscripción del estudiante',
        );
      }

      if (!lead.ventaModulo) {
        await this.ventasService.registrarDesdeLead(
          lead.id,
          {
            medioPago: datosPago.medioPago,
            moneda: datosPago.moneda,
            referenciaPago: datosPago.referenciaPago,
            observaciones: datosPago.observaciones,
            inscripcionId: inscripcion.id,
          },
        );
      }

      if (nuevaInscripcion) {
        await this.prisma.notificaciones.create({
          data: {
            usuarioId: lead.usuarioId,
            tipo: 'INSCRIPCION',
            titulo: '¡Ya estás inscrito!',
            contenido: `Fuiste inscrito correctamente al módulo ${lead.modulo.nombre} del curso ${lead.modulo.curso.nombre}.`,
            urlAccion: '/panel/cursos/mis-cursos',
            estado: 'pendiente',
          },
        });
      }
    }

    const convertidoEn =
      estado === EstadoLead.CONVERTIDO
        ? new Date()
        : null;

    return this.prisma.lead.update({
      where: { id },
      data: {
        estado,
        convertidoEn,
      },
      select: {
        id: true,
        estado: true,
        convertidoEn: true,
        actualizadoEn: true,
      },
    });
  }
}