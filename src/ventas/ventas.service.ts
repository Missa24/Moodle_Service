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


  async getResumen(desde?: string, hasta?: string) {
    const where: Prisma.VentaModuloWhereInput = {};

    if (desde || hasta) {
      where.creadoEn = {};

      if (desde) {
        where.creadoEn.gte = new Date(`${desde}T00:00:00.000`);
      }

      if (hasta) {
        where.creadoEn.lte = new Date(`${hasta}T23:59:59.999`);
      }
    }

    const wherePaypal: Prisma.VentaModuloWhereInput = {
      ...where,
      medioPago: MedioPago.PAYPAL,
    };

    const whereBolivia: Prisma.VentaModuloWhereInput = {
      ...where,
      medioPago: MedioPago.BOLIVIA,
    };

    const [
      totalVentas,
      resumenGeneral,
      totalVentasPaypal,
      resumenPaypal,
      totalVentasBolivia,
      resumenBolivia,
    ] = await this.prisma.$transaction([
      this.prisma.ventaModulo.count({
        where,
      }),

      this.prisma.ventaModulo.aggregate({
        where,
        _sum: {
          montoCobrado: true,
          comision: true,
        },
      }),

      this.prisma.ventaModulo.count({
        where: wherePaypal,
      }),

      this.prisma.ventaModulo.aggregate({
        where: wherePaypal,
        _sum: {
          montoCobrado: true,
          comision: true,
        },
      }),

      this.prisma.ventaModulo.count({
        where: whereBolivia,
      }),

      this.prisma.ventaModulo.aggregate({
        where: whereBolivia,
        _sum: {
          montoCobrado: true,
          comision: true,
        },
      }),
    ]);

    const totalCobrado = Number(
      resumenGeneral._sum.montoCobrado ?? 0,
    );

    const totalComisiones = Number(
      resumenGeneral._sum.comision ?? 0,
    );

    const paypalCobrado = Number(
      resumenPaypal._sum.montoCobrado ?? 0,
    );

    const paypalComisiones = Number(
      resumenPaypal._sum.comision ?? 0,
    );

    const boliviaCobrado = Number(
      resumenBolivia._sum.montoCobrado ?? 0,
    );

    const boliviaComisiones = Number(
      resumenBolivia._sum.comision ?? 0,
    );

    return {
      totalVentas,
      totalCobrado,
      totalComisiones,
      gananciaNeta: totalCobrado - totalComisiones,

      paypal: {
        ventas: totalVentasPaypal,
        cobrado: paypalCobrado,
        comisiones: paypalComisiones,
        neto: paypalCobrado - paypalComisiones,
      },

      bolivia: {
        ventas: totalVentasBolivia,
        cobrado: boliviaCobrado,
        comisiones: boliviaComisiones,
        neto: boliviaCobrado - boliviaComisiones,
      },
    };
  }

  async getEstadisticas(params: {
    desde?: string;
    hasta?: string;
    agrupacion?: string;
  }) {
    const agrupacion =
      params.agrupacion?.trim().toUpperCase() ?? 'MES';

    if (
      agrupacion !== 'DIA' &&
      agrupacion !== 'MES' &&
      agrupacion !== 'ANIO'
    ) {
      throw new BadRequestException(
        'La agrupación debe ser DIA, MES o ANIO',
      );
    }

    const crearFecha = (
      valor: string,
      finDelDia = false,
    ) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        throw new BadRequestException(
          'Las fechas deben tener el formato YYYY-MM-DD',
        );
      }

      const fecha = new Date(
        `${valor}T${finDelDia
          ? '23:59:59.999'
          : '00:00:00.000'
        }-04:00`,
      );

      if (Number.isNaN(fecha.getTime())) {
        throw new BadRequestException(
          'La fecha indicada no es válida',
        );
      }

      return fecha;
    };

    const desdeFecha = params.desde
      ? crearFecha(params.desde)
      : undefined;

    const hastaFecha = params.hasta
      ? crearFecha(params.hasta, true)
      : undefined;

    if (
      desdeFecha &&
      hastaFecha &&
      desdeFecha > hastaFecha
    ) {
      throw new BadRequestException(
        'La fecha inicial no puede ser mayor a la fecha final',
      );
    }

    const where: Prisma.VentaModuloWhereInput = {
      ...(desdeFecha || hastaFecha
        ? {
          creadoEn: {
            ...(desdeFecha && {
              gte: desdeFecha,
            }),
            ...(hastaFecha && {
              lte: hastaFecha,
            }),
          },
        }
        : {}),
    };

    const ventas =
      await this.prisma.ventaModulo.findMany({
        where,
        select: {
          creadoEn: true,
          montoCobrado: true,
          comision: true,
          medioPago: true,
        },
        orderBy: {
          creadoEn: 'asc',
        },
      });

    const obtenerPeriodo = (
      fecha: Date,
    ): string => {
      const partes =
        new Intl.DateTimeFormat(
          'en-US',
          {
            timeZone: 'America/La_Paz',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          },
        ).formatToParts(fecha);

      const anio =
        partes.find(
          (parte) =>
            parte.type === 'year',
        )?.value ?? '';

      const mes =
        partes.find(
          (parte) =>
            parte.type === 'month',
        )?.value ?? '';

      const dia =
        partes.find(
          (parte) =>
            parte.type === 'day',
        )?.value ?? '';

      if (agrupacion === 'ANIO') {
        return anio;
      }

      if (agrupacion === 'MES') {
        return `${anio}-${mes}`;
      }

      return `${anio}-${mes}-${dia}`;
    };

    type EstadisticaAcumulada = {
      periodo: string;
      ventas: number;
      cobrado: number;
      comisiones: number;
      neto: number;
      paypal: number;
      bolivia: number;
    };

    const agrupado =
      new Map<
        string,
        EstadisticaAcumulada
      >();

    for (const venta of ventas) {
      const periodo =
        obtenerPeriodo(
          venta.creadoEn,
        );

      const cobrado =
        Number(
          venta.montoCobrado,
        );

      const comision =
        Number(
          venta.comision,
        );

      const neto =
        cobrado -
        comision;

      const existente =
        agrupado.get(periodo);

      if (existente) {
        existente.ventas += 1;
        existente.cobrado +=
          cobrado;
        existente.comisiones +=
          comision;
        existente.neto +=
          neto;

        if (
          venta.medioPago ===
          MedioPago.PAYPAL
        ) {
          existente.paypal +=
            neto;
        }

        if (
          venta.medioPago ===
          MedioPago.BOLIVIA
        ) {
          existente.bolivia +=
            neto;
        }

        continue;
      }

      agrupado.set(
        periodo,
        {
          periodo,
          ventas: 1,
          cobrado,
          comisiones: comision,
          neto,
          paypal:
            venta.medioPago ===
              MedioPago.PAYPAL
              ? neto
              : 0,
          bolivia:
            venta.medioPago ===
              MedioPago.BOLIVIA
              ? neto
              : 0,
        },
      );
    }

    const redondear = (
      valor: number,
    ) =>
      Math.round(
        valor * 100,
      ) / 100;

    const data =
      Array.from(
        agrupado.values(),
      )
        .sort((a, b) =>
          a.periodo.localeCompare(
            b.periodo,
          ),
        )
        .map((item) => ({
          periodo:
            item.periodo,
          ventas:
            item.ventas,
          cobrado:
            redondear(
              item.cobrado,
            ),
          comisiones:
            redondear(
              item.comisiones,
            ),
          neto:
            redondear(
              item.neto,
            ),
          paypal:
            redondear(
              item.paypal,
            ),
          bolivia:
            redondear(
              item.bolivia,
            ),
        }));

    return {
      agrupacion,
      data,
    };
  }
}