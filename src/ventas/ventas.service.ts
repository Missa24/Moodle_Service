import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  MedioPago,
  Prisma,
} from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

const ventaInclude = {
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
  descuento: {
    select: {
      id: true,
      nombre: true,
    },
  },
  lead: {
    select: {
      id: true,
      estado: true,
    },
  },
  inscripcion: {
    select: {
      id: true,
      numeroInscripcion: true,
      estado: true,
    },
  },
} satisfies Prisma.VentaModuloInclude;

type VentaConRelaciones =
  Prisma.VentaModuloGetPayload<{
    include: typeof ventaInclude;
  }>;

type RegistrarVentaDesdeLeadInput = {
  medioPago: MedioPago;
  moneda?: string;
  referenciaPago?: string;
  observaciones?: string;
  inscripcionId?: string;
};

type FiltrosVentas = {
  usuarioId?: string;
  moduloId?: string;
  medioPago?: MedioPago;
  moneda?: string;
  comisionConfirmada?: boolean;
  desde?: string;
  hasta?: string;
};

@Injectable()
export class VentasService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  private redondear(valor: number) {
    return Math.round(
      (valor + Number.EPSILON) * 100,
    ) / 100;
  }

  private formatearVenta(
    venta: VentaConRelaciones,
  ) {
    const precioBase =
      Number(venta.precioBase);

    const descuentoValor =
      venta.descuentoValor !== null
        ? Number(venta.descuentoValor)
        : null;

    const montoDescuento =
      Number(venta.montoDescuento);

    const montoCobrado =
      Number(venta.montoCobrado);

    const comision =
      Number(venta.comision);

    return {
      ...venta,
      precioBase,
      descuentoValor,
      montoDescuento,
      montoCobrado,
      comision,
      totalRecibido:
        this.redondear(
          montoCobrado - comision,
        ),
    };
  }

  async registrarDesdeLead(
    leadId: string,
    data: RegistrarVentaDesdeLeadInput,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;

    const lead =
      await db.lead.findUnique({
        where: {
          id: leadId,
        },
        include: {
          ventaModulo: true,
          usuario: {
            include: {
              perfil: true,
            },
          },
          modulo: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

    if (!lead) {
      throw new NotFoundException(
        'Lead no encontrado',
      );
    }

    if (lead.ventaModulo) {
      throw new BadRequestException(
        'Este lead ya tiene una venta registrada',
      );
    }

    const precio =
      await db.precio.findFirst({
        where: {
          moduloId:
            lead.moduloId,
        },
        orderBy: {
          creadoEn: 'desc',
        },
      });

    if (!precio) {
      throw new BadRequestException(
        'El módulo no tiene un precio configurado',
      );
    }

    const ahora = new Date();

    const descuento =
      await db.descuento.findFirst({
        where: {
          habilitado: true,
          iniciaEn: {
            lte: ahora,
          },
          finalizaEn: {
            gte: ahora,
          },
          modulos: {
            some: {
              moduloId:
                lead.moduloId,
            },
          },
        },
        orderBy: {
          iniciaEn: 'desc',
        },
      });

    const precioBase =
      Number(precio.costo);

    let montoDescuento = 0;

    if (descuento) {
      const valor =
        Number(descuento.valor);

      if (
        descuento.tipo ===
        'PORCENTAJE'
      ) {
        montoDescuento =
          precioBase *
          (valor / 100);
      } else {
        montoDescuento =
          valor;
      }

      montoDescuento =
        Math.min(
          montoDescuento,
          precioBase,
        );
    }

    montoDescuento =
      this.redondear(
        montoDescuento,
      );

    const montoCobrado =
      this.redondear(
        Math.max(
          precioBase -
          montoDescuento,
          0,
        ),
      );

    const moneda =
      (
        data.moneda ??
        (data.medioPago ===
          MedioPago.PAYPAL
          ? 'USD'
          : 'BOB')
      )
        .trim()
        .toUpperCase();

    if (moneda.length !== 3) {
      throw new BadRequestException(
        'La moneda debe tener un código de 3 caracteres',
      );
    }

    const venta =
      await db.ventaModulo.create({
        data: {
          usuarioId:
            lead.usuarioId,

          moduloId:
            lead.moduloId,

          leadId:
            lead.id,

          inscripcionId:
            data.inscripcionId ??
            null,

          descuentoId:
            descuento?.id ??
            null,

          precioBase:
            new Prisma.Decimal(
              precioBase,
            ),

          descuentoNombre:
            descuento?.nombre ??
            null,

          descuentoTipo:
            descuento?.tipo ??
            null,

          descuentoValor:
            descuento
              ? new Prisma.Decimal(
                Number(
                  descuento.valor,
                ),
              )
              : null,

          montoDescuento:
            new Prisma.Decimal(
              montoDescuento,
            ),

          montoCobrado:
            new Prisma.Decimal(
              montoCobrado,
            ),

          comision:
            new Prisma.Decimal(
              0,
            ),

          comisionConfirmada:
            false,

          moneda,

          medioPago:
            data.medioPago,

          paisCodigo:
            lead.usuario
              .perfil
              ?.paisCodigo ??
            null,

          referenciaPago:
            data.referenciaPago
              ?.trim() ||
            null,

          observaciones:
            data.observaciones
              ?.trim() ||
            null,
        },
        include:
          ventaInclude,
      });

    return this.formatearVenta(
      venta,
    );
  }

  async findAll(
    page = 1,
    limit = 10,
    filtros: FiltrosVentas = {},
  ) {
    page = Math.max(
      Number(page) || 1,
      1,
    );

    limit = Math.min(
      Math.max(
        Number(limit) || 10,
        1,
      ),
      100,
    );

    const where:
      Prisma.VentaModuloWhereInput =
      {};

    if (filtros.usuarioId) {
      where.usuarioId =
        filtros.usuarioId;
    }

    if (filtros.moduloId) {
      where.moduloId =
        filtros.moduloId;
    }

    if (filtros.medioPago) {
      where.medioPago =
        filtros.medioPago;
    }

    if (filtros.moneda) {
      where.moneda =
        filtros.moneda
          .trim()
          .toUpperCase();
    }

    if (
      filtros.comisionConfirmada !==
      undefined
    ) {
      where.comisionConfirmada =
        filtros.comisionConfirmada;
    }

    if (
      filtros.desde ||
      filtros.hasta
    ) {
      where.creadoEn = {};

      if (filtros.desde) {
        where.creadoEn.gte =
          new Date(
            filtros.desde,
          );
      }

      if (filtros.hasta) {
        where.creadoEn.lte =
          new Date(
            filtros.hasta,
          );
      }
    }

    const [ventas, total] =
      await this.prisma.$transaction(
        [
          this.prisma.ventaModulo.findMany(
            {
              where,
              include:
                ventaInclude,
              orderBy: {
                creadoEn:
                  'desc',
              },
              skip:
                (page - 1) *
                limit,
              take: limit,
            },
          ),

          this.prisma.ventaModulo.count(
            {
              where,
            },
          ),
        ],
      );

    return {
      data: ventas.map(
        (venta) =>
          this.formatearVenta(
            venta,
          ),
      ),
      meta: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(
            total / limit,
          ) || 1,
      },
    };
  }

  async findOne(id: string) {
    const venta =
      await this.prisma.ventaModulo.findUnique(
        {
          where: {
            id,
          },
          include:
            ventaInclude,
        },
      );

    if (!venta) {
      throw new NotFoundException(
        'Venta no encontrada',
      );
    }

    return this.formatearVenta(
      venta,
    );
  }

  async actualizarComision(
    id: string,
    comision: number,
  ) {
    const venta =
      await this.prisma.ventaModulo.findUnique(
        {
          where: {
            id,
          },
        },
      );

    if (!venta) {
      throw new NotFoundException(
        'Venta no encontrada',
      );
    }

    const montoCobrado =
      Number(
        venta.montoCobrado,
      );

    const nuevaComision =
      Number(comision);

    if (
      !Number.isFinite(
        nuevaComision,
      ) ||
      nuevaComision < 0
    ) {
      throw new BadRequestException(
        'La comisión debe ser un valor válido mayor o igual a 0',
      );
    }

    if (
      nuevaComision >
      montoCobrado
    ) {
      throw new BadRequestException(
        'La comisión no puede ser mayor al monto cobrado',
      );
    }

    const actualizado =
      await this.prisma.ventaModulo.update(
        {
          where: {
            id,
          },
          data: {
            comision:
              new Prisma.Decimal(
                this.redondear(
                  nuevaComision,
                ),
              ),
            comisionConfirmada:
              true,
          },
          include:
            ventaInclude,
        },
      );

    return this.formatearVenta(
      actualizado,
    );
  }

  async marcarComisionPendiente(
    id: string,
  ) {
    const venta =
      await this.prisma.ventaModulo.findUnique(
        {
          where: {
            id,
          },
          select: {
            id: true,
          },
        },
      );

    if (!venta) {
      throw new NotFoundException(
        'Venta no encontrada',
      );
    }

    const actualizado =
      await this.prisma.ventaModulo.update(
        {
          where: {
            id,
          },
          data: {
            comision:
              new Prisma.Decimal(
                0,
              ),
            comisionConfirmada:
              false,
          },
          include:
            ventaInclude,
        },
      );

    return this.formatearVenta(
      actualizado,
    );
  }

  async vincularInscripcion(
    ventaId: string,
    inscripcionId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;

    const venta =
      await db.ventaModulo.findUnique(
        {
          where: {
            id: ventaId,
          },
        },
      );

    if (!venta) {
      throw new NotFoundException(
        'Venta no encontrada',
      );
    }

    const inscripcion =
      await db.inscripcion.findUnique(
        {
          where: {
            id: inscripcionId,
          },
        },
      );

    if (!inscripcion) {
      throw new NotFoundException(
        'Inscripción no encontrada',
      );
    }

    if (
      inscripcion.estudianteId !==
      venta.usuarioId ||
      inscripcion.moduloId !==
      venta.moduloId
    ) {
      throw new BadRequestException(
        'La inscripción no corresponde al estudiante o módulo de esta venta',
      );
    }

    const actualizado =
      await db.ventaModulo.update(
        {
          where: {
            id: ventaId,
          },
          data: {
            inscripcionId,
          },
          include:
            ventaInclude,
        },
      );

    return this.formatearVenta(
      actualizado,
    );
  }
}