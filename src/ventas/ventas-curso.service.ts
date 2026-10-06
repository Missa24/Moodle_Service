import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    MedioPago,
    Prisma,
    TipoCompra,
    TipoDescuentoCurso,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const ventaCursoInclude = {
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
    curso: {
        select: {
            id: true,
            nombre: true,
            slug: true,
        },
    },
    lead: {
        select: {
            id: true,
            estado: true,
            tipoCompra: true,
        },
    },
    detalles: {
        select: {
            id: true,
            moduloId: true,
            moduloNombre: true,
            moduloOrden: true,
            precioModulo: true,
        },
        orderBy: { moduloOrden: 'asc' },
    },
    inscripciones: {
        select: {
            id: true,
            moduloId: true,
            numeroInscripcion: true,
            estado: true,
            estadoAcceso: true,
            modulo: {
                select: {
                    id: true,
                    nombre: true,
                    orden: true,
                },
            },
        },
        orderBy: { modulo: { orden: 'asc' } },
    },
} satisfies Prisma.VentaCursoInclude;

type VentaCursoConRelaciones = Prisma.VentaCursoGetPayload<{
    include: typeof ventaCursoInclude;
}>;

type RegistrarVentaCursoDesdeLeadInput = {
    medioPago: MedioPago;
    moneda?: string;
    montoCobrado: number;
    referenciaPago?: string;
    observaciones?: string;
    comprobantePagoUrl?: string;
    comprobantePagoPublicId?: string;
    comprobantePagoNombre?: string;
};

@Injectable()
export class VentasCursoService {
    constructor(private readonly prisma: PrismaService) { }

    private formatearVenta(venta: VentaCursoConRelaciones) {
        return {
            ...venta,
            precioBase: Number(venta.precioBase),
            descuentoValor:
                venta.descuentoValor !== null
                    ? Number(venta.descuentoValor)
                    : null,
            moduloDescuentoPrecio:
                venta.moduloDescuentoPrecio !== null
                    ? Number(venta.moduloDescuentoPrecio)
                    : null,
            montoDescuento: Number(venta.montoDescuento),
            montoCobrado: Number(venta.montoCobrado),
            comision: Number(venta.comision),
            totalRecibido:
                Number(venta.montoCobrado) -
                Number(venta.comision),
            detalles: venta.detalles.map((detalle) => ({
                ...detalle,
                precioModulo: Number(detalle.precioModulo),
            })),
        };
    }

    private async obtenerVenta(
        id: string,
        db: PrismaService | Prisma.TransactionClient,
    ) {
        const venta = await db.ventaCurso.findUnique({
            where: { id },
            include: ventaCursoInclude,
        });

        if (!venta) {
            throw new NotFoundException(
                'Venta de curso no encontrada',
            );
        }

        return this.formatearVenta(venta);
    }

    async registrarDesdeLead(
        leadId: string,
        data: RegistrarVentaCursoDesdeLeadInput,
        tx?: Prisma.TransactionClient,
    ) {
        const db = tx ?? this.prisma;

        const lead = await db.lead.findUnique({
            where: { id: leadId },
            select: {
                id: true,
                usuarioId: true,
                cursoId: true,
                tipoCompra: true,
                referenciaPago: true,
                comprobantePagoUrl: true,
                comprobantePagoPublicId: true,
                comprobantePagoNombre: true,
                ventaCurso: { select: { id: true } },
                usuario: {
                    select: {
                        perfil: { select: { paisCodigo: true } },
                    },
                },
                curso: {
                    select: {
                        id: true,
                        nombre: true,
                        configuracionVenta: {
                            select: {
                                tipoDescuento: true,
                                porcentaje: true,
                                moduloDescuentoId: true,
                                habilitado: true,
                            },
                        },
                        modulos: {
                            where: { estaPublicado: true },
                            orderBy: { orden: 'asc' },
                            select: {
                                id: true,
                                nombre: true,
                                orden: true,
                                precios: {
                                    orderBy: { creadoEn: 'desc' },
                                    take: 1,
                                    select: { costo: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!lead) {
            throw new NotFoundException('Lead no encontrado');
        }

        if (lead.tipoCompra !== TipoCompra.CURSO) {
            throw new BadRequestException(
                'Este lead no corresponde a una compra de curso',
            );
        }

        if (!lead.cursoId || !lead.curso) {
            throw new BadRequestException(
                'El lead no tiene un curso asociado',
            );
        }

        if (lead.ventaCurso) {
            return this.obtenerVenta(lead.ventaCurso.id, db);
        }

        const ventaExistente = await db.ventaCurso.findUnique({
            where: {
                usuarioId_cursoId: {
                    usuarioId: lead.usuarioId,
                    cursoId: lead.cursoId,
                },
            },
            select: { id: true },
        });

        if (ventaExistente) {
            throw new BadRequestException(
                'El estudiante ya adquirió este curso',
            );
        }

        if (!lead.curso.modulos.length) {
            throw new BadRequestException(
                'El curso no tiene módulos publicados',
            );
        }

        const moduloSinPrecio = lead.curso.modulos.find(
            (modulo) => !modulo.precios.length,
        );

        if (moduloSinPrecio) {
            throw new BadRequestException(
                `El módulo "${moduloSinPrecio.nombre}" no tiene un precio configurado`,
            );
        }

        const configuracion = lead.curso.configuracionVenta;

        if (!configuracion?.habilitado) {
            throw new BadRequestException(
                'La venta del curso completo no está habilitada',
            );
        }

        let precioBase = new Prisma.Decimal(0);

        for (const modulo of lead.curso.modulos) {
            precioBase = precioBase.plus(modulo.precios[0].costo);
        }

        let montoDescuento = new Prisma.Decimal(0);
        let descuentoValor: Prisma.Decimal | null = null;
        let moduloDescuentoId: string | null = null;
        let moduloDescuentoNombre: string | null = null;
        let moduloDescuentoPrecio: Prisma.Decimal | null = null;

        if (
            configuracion.tipoDescuento ===
            TipoDescuentoCurso.PORCENTAJE
        ) {
            if (configuracion.porcentaje === null) {
                throw new BadRequestException(
                    'La configuración del curso no tiene porcentaje de descuento',
                );
            }

            descuentoValor = configuracion.porcentaje;

            montoDescuento = precioBase
                .mul(configuracion.porcentaje)
                .div(100);
        }

        if (
            configuracion.tipoDescuento ===
            TipoDescuentoCurso.MODULO_GRATIS
        ) {
            if (!configuracion.moduloDescuentoId) {
                throw new BadRequestException(
                    'No se configuró el módulo gratuito',
                );
            }

            const moduloGratis = lead.curso.modulos.find(
                (modulo) =>
                    modulo.id === configuracion.moduloDescuentoId,
            );

            if (!moduloGratis) {
                throw new BadRequestException(
                    'El módulo configurado como gratuito no pertenece a los módulos publicados del curso',
                );
            }

            const precioModulo = moduloGratis.precios[0].costo;

            montoDescuento = new Prisma.Decimal(precioModulo);
            moduloDescuentoId = moduloGratis.id;
            moduloDescuentoNombre = moduloGratis.nombre;
            moduloDescuentoPrecio =
                new Prisma.Decimal(precioModulo);
        }

        precioBase = new Prisma.Decimal(
            precioBase.toFixed(2),
        );

        montoDescuento = new Prisma.Decimal(
            montoDescuento.toFixed(2),
        );

        const montoCobrado = Number(data.montoCobrado);

        if (!Number.isFinite(montoCobrado) || montoCobrado <= 0) {
            throw new BadRequestException(
                'El monto cobrado debe ser un valor mayor a 0',
            );
        }

        const moneda = (
            data.moneda ??
            (data.medioPago === MedioPago.PAYPAL ? 'USD' : 'BOB')
        )
            .trim()
            .toUpperCase();

        if (moneda.length !== 3) {
            throw new BadRequestException(
                'La moneda debe tener un código de 3 caracteres',
            );
        }

        const venta = await db.ventaCurso.create({
            data: {
                usuarioId: lead.usuarioId,
                cursoId: lead.cursoId,
                leadId: lead.id,
                precioBase,
                descuentoTipo: configuracion.tipoDescuento,
                descuentoValor,
                moduloDescuentoId,
                moduloDescuentoNombre,
                moduloDescuentoPrecio,
                montoDescuento,
                montoCobrado,
                comision: new Prisma.Decimal(0),
                comisionConfirmada: false,

                moneda,
                medioPago: data.medioPago,
                paisCodigo:
                    lead.usuario.perfil?.paisCodigo ?? null,
                referenciaPago:
                    data.referenciaPago?.trim() ||
                    lead.referenciaPago ||
                    null,
                observaciones:
                    data.observaciones?.trim() || null,
                comprobantePagoUrl: data.comprobantePagoUrl ?? null,
                comprobantePagoPublicId: data.comprobantePagoPublicId ?? null,
                comprobantePagoNombre: data.comprobantePagoNombre ?? null,
                detalles: {
                    create: lead.curso.modulos.map((modulo) => ({
                        moduloId: modulo.id,
                        moduloNombre: modulo.nombre,
                        moduloOrden: modulo.orden,
                        precioModulo: modulo.precios[0].costo,
                    })),
                },
            },
            include: ventaCursoInclude,
        });

        return this.formatearVenta(venta);
    }

    async findOne(id: string) {
        return this.obtenerVenta(id, this.prisma);
    }
}