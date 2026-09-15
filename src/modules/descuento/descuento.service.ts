import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateDescuentoDto } from './dto/create-descuento.dto';
import { UpdateDescuentoDto } from './dto/update-descuento.dto';
import { PrismaService } from 'src/prisma/prisma.service';

import { TipoDescuento, Prisma } from '@prisma/client';

type DescuentoConModulos =
  Prisma.DescuentoGetPayload<{
    include: {
      modulos: {
        include: {
          modulo: {
            select: {
              id: true;
              nombre: true;
              curso: {
                select: {
                  id: true;
                  nombre: true;
                };
              };
            };
          };
        };
      };
    };
  }>;


@Injectable()
export class DescuentoService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  private validarDescuento(
    tipo: TipoDescuento,
    valor: number,
    iniciaEn: Date,
    finalizaEn: Date,
  ) {
    if (finalizaEn <= iniciaEn) {
      throw new BadRequestException(
        'La fecha de finalización debe ser posterior a la fecha de inicio',
      );
    }

    if (
      tipo === TipoDescuento.PORCENTAJE &&
      valor > 100
    ) {
      throw new BadRequestException(
        'El descuento porcentual no puede ser mayor al 100%',
      );
    }

    if (valor <= 0) {
      throw new BadRequestException(
        'El valor del descuento debe ser mayor a 0',
      );
    }
  }

  private async obtenerModuloIds(
    aplicarATodos?: boolean,
    moduloIds?: string[],
  ) {
    if (aplicarATodos) {
      const modulos =
        await this.prisma.modulo.findMany({
          select: {
            id: true,
          },
        });

      return modulos.map(
        (modulo) => modulo.id,
      );
    }

    if (
      !moduloIds ||
      moduloIds.length === 0
    ) {
      return [];
    }

    const modulos =
      await this.prisma.modulo.findMany({
        where: {
          id: {
            in: moduloIds,
          },
        },

        select: {
          id: true,
        },
      });

    if (
      modulos.length !==
      moduloIds.length
    ) {
      throw new BadRequestException(
        'Uno o más módulos seleccionados no existen',
      );
    }

    return moduloIds;
  }

  async create(
    createDescuentoDto: CreateDescuentoDto,
  ) {
    const {
      nombre,
      descripcion,
      tipo,
      valor,
      iniciaEn,
      finalizaEn,
      habilitado,
      aplicarATodos,
      moduloIds,
    } = createDescuentoDto;

    const fechaInicio =
      new Date(iniciaEn);

    const fechaFin =
      new Date(finalizaEn);

    this.validarDescuento(
      tipo,
      valor,
      fechaInicio,
      fechaFin,
    );

    const modulosAplicados =
      await this.obtenerModuloIds(
        aplicarATodos,
        moduloIds,
      );

    const descuento =
      await this.prisma.descuento.create({
        data: {
          nombre:
            nombre.trim(),

          descripcion:
            descripcion?.trim() ||
            null,

          tipo,

          valor,

          iniciaEn:
            fechaInicio,

          finalizaEn:
            fechaFin,

          habilitado:
            habilitado ?? true,

          modulos: {
            create:
              modulosAplicados.map(
                (moduloId) => ({
                  moduloId,
                }),
              ),
          },
        },

        include: {
          modulos: {
            include: {
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
          },
        },
      });

    return this.formatearDescuento(
      descuento,
    );
  }

  async findAll() {
    const descuentos =
      await this.prisma.descuento.findMany({
        orderBy: {
          creadoEn: 'desc',
        },

        include: {
          modulos: {
            include: {
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
          },
        },
      });

    return descuentos.map(
      (descuento) =>
        this.formatearDescuento(
          descuento,
        ),
    );
  }

  async findOne(
    id: string,
  ) {
    const descuento =
      await this.prisma.descuento.findUnique({
        where: {
          id,
        },

        include: {
          modulos: {
            include: {
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
          },
        },
      });

    if (!descuento) {
      throw new NotFoundException(
        'Descuento no encontrado',
      );
    }

    return this.formatearDescuento(
      descuento,
    );
  }

  async update(
    id: string,
    updateDescuentoDto: UpdateDescuentoDto,
  ) {
    const descuentoActual =
      await this.prisma.descuento.findUnique({
        where: {
          id,
        },

        include: {
          modulos: true,
        },
      });

    if (!descuentoActual) {
      throw new NotFoundException(
        'Descuento no encontrado',
      );
    }

    const {
      aplicarATodos,
      moduloIds,
      nombre,
      descripcion,
      tipo,
      valor,
      iniciaEn,
      finalizaEn,
      habilitado,
    } = updateDescuentoDto;

    const tipoFinal =
      tipo ??
      descuentoActual.tipo;

    const valorFinal =
      valor !== undefined
        ? valor
        : Number(
          descuentoActual.valor,
        );

    const fechaInicioFinal =
      iniciaEn
        ? new Date(iniciaEn)
        : descuentoActual.iniciaEn;

    const fechaFinFinal =
      finalizaEn
        ? new Date(finalizaEn)
        : descuentoActual.finalizaEn;

    this.validarDescuento(
      tipoFinal,
      valorFinal,
      fechaInicioFinal,
      fechaFinFinal,
    );

    const actualizarModulos =
      aplicarATodos !== undefined ||
      moduloIds !== undefined;

    let modulosAplicados:
      string[] = [];

    if (actualizarModulos) {
      modulosAplicados =
        await this.obtenerModuloIds(
          aplicarATodos,
          moduloIds,
        );
    }

    await this.prisma.$transaction(
      async (tx) => {
        await tx.descuento.update({
          where: {
            id,
          },

          data: {
            ...(nombre !==
              undefined && {
              nombre:
                nombre.trim(),
            }),

            ...(descripcion !==
              undefined && {
              descripcion:
                descripcion.trim() ||
                null,
            }),

            ...(tipo !==
              undefined && {
              tipo,
            }),

            ...(valor !==
              undefined && {
              valor,
            }),

            ...(iniciaEn !==
              undefined && {
              iniciaEn:
                fechaInicioFinal,
            }),

            ...(finalizaEn !==
              undefined && {
              finalizaEn:
                fechaFinFinal,
            }),

            ...(habilitado !==
              undefined && {
              habilitado,
            }),
          },
        });

        if (actualizarModulos) {
          await tx.descuentoModulo.deleteMany({
            where: {
              descuentoId: id,
            },
          });

          if (
            modulosAplicados.length >
            0
          ) {
            await tx.descuentoModulo.createMany({
              data:
                modulosAplicados.map(
                  (moduloId) => ({
                    descuentoId:
                      id,

                    moduloId,
                  }),
                ),
            });
          }
        }
      },
    );

    return this.findOne(id);
  }

  async remove(
    id: string,
  ) {
    const descuento =
      await this.prisma.descuento.findUnique({
        where: {
          id,
        },
      });

    if (!descuento) {
      throw new NotFoundException(
        'Descuento no encontrado',
      );
    }

    return this.prisma.descuento.update({
      where: {
        id,
      },

      data: {
        habilitado: false,
      },
    });
  }

  async restore(
    id: string,
  ) {
    const descuento =
      await this.prisma.descuento.findUnique({
        where: {
          id,
        },
      });

    if (!descuento) {
      throw new NotFoundException(
        'Descuento no encontrado',
      );
    }

    return this.prisma.descuento.update({
      where: {
        id,
      },

      data: {
        habilitado: true,
      },
    });
  }

  private formatearDescuento(
    descuento: DescuentoConModulos,
  ) {
    const ahora = new Date();

    const vigente =
      descuento.habilitado &&
      descuento.iniciaEn <= ahora &&
      descuento.finalizaEn >= ahora;

    return {
      id: descuento.id,
      nombre: descuento.nombre,
      descripcion: descuento.descripcion,
      tipo: descuento.tipo,

      valor: Number(
        descuento.valor,
      ),

      iniciaEn:
        descuento.iniciaEn,

      finalizaEn:
        descuento.finalizaEn,

      habilitado:
        descuento.habilitado,

      vigente,

      creadoEn:
        descuento.creadoEn,

      actualizadoEn:
        descuento.actualizadoEn,

      modulos:
        descuento.modulos.map(
          (relacion) => ({
            id:
              relacion.modulo.id,

            nombre:
              relacion.modulo.nombre,

            curso: {
              id:
                relacion.modulo.curso.id,

              nombre:
                relacion.modulo.curso.nombre,
            },
          }),
        ),
    };
  }
  async resumen() {
    const ahora = new Date();

    const descuentos = await this.prisma.descuento.findMany({
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
            modulo: {
              estaPublicado: true,
            },
          },
        },
      },
      select: {
        id: true,
        modulos: {
          where: {
            modulo: {
              estaPublicado: true,
            },
          },
          select: {
            moduloId: true,
          },
        },
      },
    });

    const modulosIds = new Set(
      descuentos.flatMap((descuento) =>
        descuento.modulos.map(
          (item) => item.moduloId,
        ),
      ),
    );

    return {
      hayDescuentos: descuentos.length > 0,
      cantidadDescuentos: descuentos.length,
      cantidadModulosConDescuento: modulosIds.size,
    };
  }
}