import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoLead, MedioPago, Prisma, TipoCompra } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { InscripcionesService } from 'src/modules/inscripcion/inscripciones.service';
import { VentasService } from 'src/ventas/ventas.service';
import { VentasCursoService } from 'src/ventas/ventas-curso.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreateLeadDto } from './dto/create-lead.dto';

type DatosPagoLead = {
  medioPago?: MedioPago;
  moneda?: string;
  referenciaPago?: string;
  observaciones?: string;
};

const leadDetailSelect = {
  id: true,
  usuarioId: true,
  tipoCompra: true,
  estado: true,
  referenciaPago: true,
  comprobantePagoUrl: true,
  comprobantePagoNombre: true,
  comprobantePagoSubidoEn: true,
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
      curso: { select: { id: true, nombre: true } },
    },
  },
  curso: { select: { id: true, nombre: true } },
  ventaModulo: { select: { id: true } },
  ventaCurso: { select: { id: true } },
} satisfies Prisma.LeadSelect;

@Injectable()
export class LeadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inscripcionesService: InscripcionesService,
    private readonly ventasService: VentasService,
    private readonly ventasCursoService: VentasCursoService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  private generarNumeroInscripcion() {
    return `INS-${Date.now()}-${Math.floor(Math.random() * 1000000000)}`;
  }

  async create(usuarioId: string, dto: CreateLeadDto) {
    const tipoCompra =
      dto.tipoCompra ?? (dto.cursoId ? TipoCompra.CURSO : TipoCompra.MODULO);

    if (tipoCompra === TipoCompra.MODULO) {
      if (!dto.moduloId) {
        throw new BadRequestException(
          'Debes indicar el módulo que deseas comprar',
        );
      }

      if (dto.cursoId) {
        throw new BadRequestException(
          'Una compra de módulo no debe incluir cursoId',
        );
      }

      const modulo = await this.prisma.modulo.findUnique({
        where: { id: dto.moduloId },
        select: { id: true },
      });

      if (!modulo) {
        throw new BadRequestException('El módulo indicado no existe');
      }

      const inscripcion = await this.prisma.inscripcion.findUnique({
        where: {
          moduloId_estudianteId: {
            moduloId: dto.moduloId,
            estudianteId: usuarioId,
          },
        },
        select: { id: true, estado: true, estadoAcceso: true },
      });

      if (
        inscripcion?.estado === 'activa' &&
        inscripcion.estadoAcceso === 'habilitado'
      ) {
        throw new BadRequestException('Ya tienes acceso a este módulo');
      }

      const leadExistente = await this.prisma.lead.findUnique({
        where: {
          usuarioId_moduloId: {
            usuarioId,
            moduloId: dto.moduloId,
          },
        },
        include: { ventaModulo: { select: { id: true } } },
      });

      if (leadExistente?.ventaModulo) {
        throw new BadRequestException('Este módulo ya fue adquirido');
      }

      if (leadExistente) {
        await this.prisma.lead.update({
          where: { id: leadExistente.id },
          data: { ultimoIntentoEn: new Date() },
        });

        return {
          ok: true,
          leadId: leadExistente.id,
          tipoCompra: TipoCompra.MODULO,
        };
      }

      const lead = await this.prisma.lead.create({
        data: {
          usuarioId,
          tipoCompra: TipoCompra.MODULO,
          moduloId: dto.moduloId,
          cursoId: null,
        },
      });

      return {
        ok: true,
        leadId: lead.id,
        tipoCompra: TipoCompra.MODULO,
      };
    }

    if (tipoCompra === TipoCompra.CURSO) {
      if (!dto.cursoId) {
        throw new BadRequestException(
          'Debes indicar el curso que deseas comprar',
        );
      }

      if (dto.moduloId) {
        throw new BadRequestException(
          'Una compra de curso no debe incluir moduloId',
        );
      }

      const curso = await this.prisma.curso.findUnique({
        where: { id: dto.cursoId },
        select: {
          id: true,
          configuracionVenta: { select: { habilitado: true } },
          modulos: {
            where: { estaPublicado: true },
            select: { id: true },
          },
        },
      });

      if (!curso) {
        throw new BadRequestException('El curso indicado no existe');
      }

      if (!curso.configuracionVenta?.habilitado) {
        throw new BadRequestException(
          'La compra del curso completo no está habilitada',
        );
      }

      if (!curso.modulos.length) {
        throw new BadRequestException(
          'El curso no tiene módulos publicados',
        );
      }

      const estadoCompra = await this.obtenerEstadoCompraCurso(
        usuarioId,
        dto.cursoId,
      );

      if (estadoCompra.compradoComoCurso) {
        throw new BadRequestException(
          'Ya adquiriste este curso completo',
        );
      }

      if (estadoCompra.tieneTodosLosModulos) {
        throw new BadRequestException(
          'Ya tienes acceso a todos los módulos de este curso',
        );
      }

      const leadExistente = await this.prisma.lead.findUnique({
        where: {
          usuarioId_cursoId: {
            usuarioId,
            cursoId: dto.cursoId,
          },
        },
        include: { ventaCurso: { select: { id: true } } },
      });

      if (leadExistente?.ventaCurso) {
        throw new BadRequestException('Este curso ya fue adquirido');
      }

      if (leadExistente) {
        await this.prisma.lead.update({
          where: { id: leadExistente.id },
          data: { ultimoIntentoEn: new Date() },
        });

        return {
          ok: true,
          leadId: leadExistente.id,
          tipoCompra: TipoCompra.CURSO,
        };
      }

      const lead = await this.prisma.lead.create({
        data: {
          usuarioId,
          tipoCompra: TipoCompra.CURSO,
          cursoId: dto.cursoId,
          moduloId: null,
        },
      });

      return {
        ok: true,
        leadId: lead.id,
        tipoCompra: TipoCompra.CURSO,
      };
    }

    throw new BadRequestException('Tipo de compra inválido');
  }

  async subirComprobante(
    id: string,
    usuarioId: string,
    comprobante: Express.Multer.File,
    referenciaPago?: string,
  ) {
    if (!comprobante) {
      throw new BadRequestException('Debes adjuntar un comprobante de pago');
    }

    if (!comprobante.mimetype.startsWith('image/')) {
      throw new BadRequestException('El comprobante debe ser una imagen');
    }

    const lead = await this.prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        usuarioId: true,
        comprobantePagoPublicId: true,
        ventaModulo: { select: { id: true } },
        ventaCurso: { select: { id: true } },
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead no encontrado');
    }

    if (lead.usuarioId !== usuarioId) {
      throw new ForbiddenException(
        'No puedes modificar el comprobante de otro usuario',
      );
    }

    if (lead.ventaModulo || lead.ventaCurso) {
      throw new BadRequestException(
        'El pago ya fue confirmado y el comprobante ya no puede modificarse',
      );
    }

    const imagen = await this.cloudinaryService.uploadImage(
      comprobante,
      'lms/comprobantes-pago',
    );

    try {
      const actualizado = await this.prisma.lead.update({
        where: { id },
        data: {
          referenciaPago: referenciaPago?.trim() || null,
          comprobantePagoUrl: imagen.url,
          comprobantePagoPublicId: imagen.publicId,
          comprobantePagoNombre: comprobante.originalname,
          comprobantePagoSubidoEn: new Date(),
          ultimoIntentoEn: new Date(),
        },
        select: {
          id: true,
          referenciaPago: true,
          comprobantePagoUrl: true,
          comprobantePagoNombre: true,
          comprobantePagoSubidoEn: true,
        },
      });

      if (
        lead.comprobantePagoPublicId &&
        lead.comprobantePagoPublicId !== imagen.publicId
      ) {
        await this.cloudinaryService
          .deleteImage(lead.comprobantePagoPublicId)
          .catch(() => undefined);
      }

      return actualizado;
    } catch (error) {
      await this.cloudinaryService
        .deleteImage(imagen.publicId)
        .catch(() => undefined);

      throw error;
    }
  }

  async findAll(page = 1, limit = 10, q = '') {
    const currentPage = Math.max(page, 1);
    const currentLimit = Math.min(Math.max(limit, 1), 100);
    const search = q.trim();

    const where: Prisma.LeadWhereInput = search
      ? {
        OR: [
          {
            usuario: {
              correo: { contains: search, mode: 'insensitive' },
            },
          },
          {
            usuario: {
              perfil: {
                nombre: { contains: search, mode: 'insensitive' },
              },
            },
          },
          {
            usuario: {
              perfil: {
                apellidoPaterno: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            usuario: {
              perfil: {
                apellidoMaterno: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            usuario: {
              perfil: {
                telefono: { contains: search, mode: 'insensitive' },
              },
            },
          },
          {
            modulo: {
              nombre: { contains: search, mode: 'insensitive' },
            },
          },
          {
            modulo: {
              curso: {
                nombre: { contains: search, mode: 'insensitive' },
              },
            },
          },
          {
            curso: {
              nombre: { contains: search, mode: 'insensitive' },
            },
          },
        ],
      }
      : {};

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip: (currentPage - 1) * currentLimit,
        take: currentLimit,
        orderBy: { ultimoIntentoEn: 'desc' },
        select: leadDetailSelect,
      }),
      this.prisma.lead.count({ where }),
    ]);

    const data = leads.map((lead) => ({
      id: lead.id,
      tipoCompra: lead.tipoCompra,
      usuarioId: lead.usuario.id,
      nombre: lead.usuario.perfil?.nombre ?? '',
      apellidoPaterno: lead.usuario.perfil?.apellidoPaterno ?? '',
      apellidoMaterno: lead.usuario.perfil?.apellidoMaterno ?? '',
      correo: lead.usuario.correo,
      telefono: lead.usuario.perfil?.telefono ?? '',
      ciudad: lead.usuario.perfil?.ciudad ?? '',
      pais: lead.usuario.perfil?.pais ?? '',
      paisCodigo: lead.usuario.perfil?.paisCodigo ?? '',
      curso:
        lead.tipoCompra === TipoCompra.CURSO
          ? lead.curso
          : lead.modulo?.curso ?? null,
      modulo: lead.modulo
        ? { id: lead.modulo.id, nombre: lead.modulo.nombre }
        : null,
      ventaId:
        lead.tipoCompra === TipoCompra.CURSO
          ? lead.ventaCurso?.id ?? null
          : lead.ventaModulo?.id ?? null,
      referenciaPago: lead.referenciaPago,
      comprobantePagoUrl: lead.comprobantePagoUrl,
      comprobantePagoNombre: lead.comprobantePagoNombre,
      comprobantePagoSubidoEn: lead.comprobantePagoSubidoEn,
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
      orderBy: { ultimoIntentoEn: 'desc' },
      select: {
        id: true,
        tipoCompra: true,
        estado: true,
        referenciaPago: true,
        comprobantePagoUrl: true,
        comprobantePagoNombre: true,
        comprobantePagoSubidoEn: true,
        creadoEn: true,
        ultimoIntentoEn: true,
        convertidoEn: true,
        modulo: {
          select: {
            id: true,
            nombre: true,
            curso: { select: { id: true, nombre: true } },
          },
        },
        curso: { select: { id: true, nombre: true } },
      },
    });
  }

  async findById(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      select: leadDetailSelect,
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
    comprobante?: Express.Multer.File,
  ) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        usuarioId: true,
        tipoCompra: true,
        moduloId: true,
        cursoId: true,
        estado: true,
        ventaModulo: { select: { id: true } },
        ventaCurso: { select: { id: true } },
      },
    });

    if (!lead) throw new NotFoundException('Lead no encontrado');

    if (estado !== EstadoLead.PAGO_COMPLETADO) {
      return this.prisma.lead.update({
        where: { id },
        data: {
          estado,
          convertidoEn: estado === EstadoLead.CONVERTIDO ? new Date() : null,
        },
        select: {
          id: true,
          tipoCompra: true,
          estado: true,
          convertidoEn: true,
          actualizadoEn: true,
          ventaModulo: { select: { id: true } },
          ventaCurso: { select: { id: true } },
        },
      });
    }

    if (!datosPago?.medioPago) {
      throw new BadRequestException(
        'Debes indicar el medio de pago para confirmar el pago',
      );
    }

    if (!comprobante) {
      throw new BadRequestException('Debes adjuntar el comprobante de pago');
    }

    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

    if (!formatosPermitidos.includes(comprobante.mimetype)) {
      throw new BadRequestException(
        'El comprobante debe ser JPG, PNG o WEBP',
      );
    }

    if (lead.ventaModulo || lead.ventaCurso) {
      throw new BadRequestException(
        'Este lead ya tiene una venta registrada',
      );
    }

    const imagen = await this.cloudinaryService.uploadImage(
      comprobante,
      'lms/comprobantes-pago',
    );

    let ventaCreada = false;

    try {
      if (lead.tipoCompra === TipoCompra.MODULO) {
        if (!lead.moduloId) {
          throw new BadRequestException(
            'El lead de módulo no tiene moduloId',
          );
        }

        const estadoInscripcion =
          await this.inscripcionesService.verificarMiInscripcion(
            lead.usuarioId,
            lead.moduloId,
          );

        if (!estadoInscripcion.inscrito) {
          await this.inscripcionesService.create({
            estudianteId: lead.usuarioId,
            moduloId: lead.moduloId,
          });
        }

        const inscripcion = await this.prisma.inscripcion.findUnique({
          where: {
            moduloId_estudianteId: {
              estudianteId: lead.usuarioId,
              moduloId: lead.moduloId,
            },
          },
          select: { id: true },
        });

        if (!inscripcion) {
          throw new BadRequestException(
            'No se pudo obtener la inscripción del estudiante',
          );
        }

        await this.ventasService.registrarDesdeLead(lead.id, {
          medioPago: datosPago.medioPago,
          moneda: datosPago.moneda,
          referenciaPago: datosPago.referenciaPago,
          observaciones: datosPago.observaciones,
          inscripcionId: inscripcion.id,
          comprobantePagoUrl: imagen.url,
          comprobantePagoPublicId: imagen.publicId,
          comprobantePagoNombre: comprobante.originalname,
        });

        ventaCreada = true;
      }

      if (lead.tipoCompra === TipoCompra.CURSO) {
        if (!lead.cursoId) {
          throw new BadRequestException(
            'El lead de curso no tiene cursoId',
          );
        }

        await this.prisma.$transaction(async (tx) => {
          const venta = await this.ventasCursoService.registrarDesdeLead(
            lead.id,
            {
              medioPago: datosPago.medioPago!,
              moneda: datosPago.moneda,
              referenciaPago: datosPago.referenciaPago,
              observaciones: datosPago.observaciones,
              comprobantePagoUrl: imagen.url,
              comprobantePagoPublicId: imagen.publicId,
              comprobantePagoNombre: comprobante.originalname,
            },
            tx,
          );

          for (const detalle of venta.detalles) {
            if (!detalle.moduloId) continue;

            const existente = await tx.inscripcion.findUnique({
              where: {
                moduloId_estudianteId: {
                  moduloId: detalle.moduloId,
                  estudianteId: lead.usuarioId,
                },
              },
              select: { id: true },
            });

            if (existente) {
              await tx.inscripcion.update({
                where: { id: existente.id },
                data: {
                  estado: 'activa',
                  estadoAcceso: 'habilitado',
                },
              });

              continue;
            }

            await tx.inscripcion.create({
              data: {
                estudianteId: lead.usuarioId,
                moduloId: detalle.moduloId,
                numeroInscripcion: this.generarNumeroInscripcion(),
                estado: 'activa',
                estadoAcceso: 'habilitado',
                monto: detalle.precioModulo,
                ventaCursoId: venta.id,
              },
            });
          }
        });

        ventaCreada = true;
      }

      return await this.prisma.lead.update({
        where: { id },
        data: {
          estado: EstadoLead.PAGO_COMPLETADO,
          convertidoEn: null,
        },
        select: {
          id: true,
          tipoCompra: true,
          estado: true,
          convertidoEn: true,
          actualizadoEn: true,
          ventaModulo: { select: { id: true } },
          ventaCurso: { select: { id: true } },
        },
      });
    } catch (error) {
      if (!ventaCreada) {
        await this.cloudinaryService
          .deleteImage(imagen.publicId)
          .catch(() => undefined);
      }

      throw error;
    }
  }

  async obtenerEstadoCompraCurso(usuarioId: string, cursoId: string) {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: {
        id: true,
        modulos: {
          where: { estaPublicado: true },
          select: { id: true },
        },
      },
    });

    if (!curso) {
      throw new NotFoundException('Curso no encontrado');
    }

    const moduloIds = curso.modulos.map((modulo) => modulo.id);

    const [ventaCurso, modulosConAcceso] = await Promise.all([
      this.prisma.ventaCurso.findUnique({
        where: { usuarioId_cursoId: { usuarioId, cursoId } },
        select: { id: true, creadoEn: true },
      }),
      moduloIds.length
        ? this.prisma.inscripcion.count({
          where: {
            estudianteId: usuarioId,
            moduloId: { in: moduloIds },
            estado: 'activa',
            estadoAcceso: 'habilitado',
          },
        })
        : Promise.resolve(0),
    ]);

    const tieneTodosLosModulos =
      moduloIds.length > 0 && modulosConAcceso === moduloIds.length;

    const compradoComoCurso = Boolean(ventaCurso);

    return {
      cursoId,
      compradoComoCurso,
      ventaCursoId: ventaCurso?.id ?? null,
      compradoEn: ventaCurso?.creadoEn ?? null,
      modulosPublicados: moduloIds.length,
      modulosConAcceso,
      tieneTodosLosModulos,
      puedeComprarCurso: !compradoComoCurso && !tieneTodosLosModulos,
    };
  }
}