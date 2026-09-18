import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Prisma,
  TipoDescuento,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { QueryModuloDto } from './dto/query-modulo.dto';
import { QueryModuloCursoDto } from './dto/query-modulo-curso.dto';

import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrecioService } from '../precio/precio.service';

type PrecioActual = {
  costo: Prisma.Decimal;
  urlPago: string | null;
  urlPagoBolivia: string | null;
} | null;

type DescuentoModuloVigente = {
  descuento: {
    id: string;
    nombre: string;
    descripcion: string | null;
    tipo: TipoDescuento;
    valor: Prisma.Decimal;
    iniciaEn: Date;
    finalizaEn: Date;
  };
};

@Injectable()
export class ModuloService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly precioService: PrecioService,
  ) { }

  private redondearMonto(
    valor: number,
  ) {
    return (
      Math.round(
        (valor + Number.EPSILON) * 100,
      ) / 100
    );
  }

  private calcularPrecio(
    precioActual: PrecioActual,
    descuentos: DescuentoModuloVigente[],
  ) {
    if (!precioActual) {
      return {
        costo: null,
        descuento: null,
        montoDescuento: 0,
        precioFinal: null,
        urlPago: null,
        urlPagoBolivia: null,
      };
    }

    const costo =
      Number(
        precioActual.costo,
      );

    if (
      descuentos.length === 0
    ) {
      return {
        costo,

        descuento: null,

        montoDescuento: 0,

        precioFinal:
          costo,

        urlPago:
          precioActual.urlPago,

        urlPagoBolivia:
          precioActual.urlPagoBolivia,
      };
    }

    const descuentosOrdenados =
      [...descuentos].sort(
        (a, b) =>
          b.descuento.iniciaEn.getTime() -
          a.descuento.iniciaEn.getTime(),
      );

    const descuentoActual =
      descuentosOrdenados[0]
        .descuento;

    const valorDescuento =
      Number(
        descuentoActual.valor,
      );

    let montoDescuento =
      0;

    if (
      descuentoActual.tipo ===
      TipoDescuento.PORCENTAJE
    ) {
      montoDescuento =
        costo *
        (valorDescuento /
          100);
    }

    if (
      descuentoActual.tipo ===
      TipoDescuento.MONTO_FIJO
    ) {
      montoDescuento =
        valorDescuento;
    }

    montoDescuento =
      Math.min(
        montoDescuento,
        costo,
      );

    montoDescuento =
      this.redondearMonto(
        montoDescuento,
      );

    const precioFinal =
      this.redondearMonto(
        Math.max(
          costo -
          montoDescuento,
          0,
        ),
      );

    return {
      costo,

      descuento: {
        id:
          descuentoActual.id,

        nombre:
          descuentoActual.nombre,

        descripcion:
          descuentoActual.descripcion,

        tipo:
          descuentoActual.tipo,

        valor:
          valorDescuento,

        iniciaEn:
          descuentoActual.iniciaEn,

        finalizaEn:
          descuentoActual.finalizaEn,
      },

      montoDescuento,

      precioFinal,

      urlPago:
        precioActual.urlPago,

      urlPagoBolivia:
        precioActual.urlPagoBolivia,
    };
  }

  private async validarDescuento(
    descuentoId: string,
  ) {
    const descuento =
      await this.prisma.descuento.findUnique({
        where: {
          id: descuentoId,
        },
      });

    if (!descuento) {
      throw new NotFoundException(
        'El descuento seleccionado no existe',
      );
    }

    return descuento;
  }

  async create(
    createModuloDto: CreateModuloDto,
    file?: Express.Multer.File,
    qrPagoBolivia?: Express.Multer.File,
  ) {
    const curso =
      await this.prisma.curso.findUnique({
        where: {
          id:
            createModuloDto.cursoId,
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'El curso indicado no existe',
      );
    }

    const {
      costo,
      urlPago,
      urlPagoBolivia,
      descuentoId,
      ...moduloData
    } = createModuloDto;

    if (
      descuentoId &&
      descuentoId.trim()
    ) {
      await this.validarDescuento(
        descuentoId,
      );
    }

    let rutaImagen:
      | string
      | undefined;

    if (file) {
      const imagen =
        await this.cloudinaryService.uploadImage(
          file,
          'lms/modulos',
        );

      rutaImagen =
        imagen.url;
    }

    let rutaQrPagoBolivia: string | undefined;

    if (qrPagoBolivia) {
      const imagenQr = await this.cloudinaryService.uploadImage(
        qrPagoBolivia,
        'lms/pagos/bolivia',
      );

      rutaQrPagoBolivia = imagenQr.url;
    }

    const ultimoModulo =
      await this.prisma.modulo.findFirst({
        where: {
          cursoId:
            createModuloDto.cursoId,
        },

        orderBy: {
          orden: 'desc',
        },

        select: {
          orden: true,
        },
      });

    const siguienteOrden =
      (ultimoModulo?.orden ??
        -1) + 1;

    const modulo =
      await this.prisma.modulo.create({
        data: {
          ...moduloData,

          orden:
            siguienteOrden,

          rutaImagen,
        },
      });

    const crearPrecio =
      costo !== undefined ||
      urlPago !== undefined ||
      urlPagoBolivia !==
      undefined;

    if (crearPrecio) {
      await this.precioService.create({
        moduloId:
          modulo.id,

        costo:
          costo ?? 0,

        urlPago:
          urlPago ?? null,

        urlPagoBolivia: rutaQrPagoBolivia ?? urlPagoBolivia ?? null,
      });
    }

    if (
      descuentoId &&
      descuentoId.trim()
    ) {
      await this.prisma.descuentoModulo.create({
        data: {
          moduloId:
            modulo.id,

          descuentoId,
        },
      });
    }

    return this.findOne(
      modulo.id,
    );
  }

  async findAll(
    query: QueryModuloDto,
  ) {
    const {
      page = 1,
      limit = 10,
      nombre,
      categoria,
      cursoId,
      estaPublicado,
    } = query;

    const ahora =
      new Date();

    const where:
      Prisma.ModuloWhereInput = {
      ...(nombre && {
        nombre: {
          contains:
            nombre,

          mode:
            'insensitive',
        },
      }),

      ...(cursoId && {
        cursoId,
      }),

      ...(estaPublicado !==
        undefined && {
        estaPublicado,
      }),

      ...(categoria && {
        curso: {
          categoria: {
            nombre: {
              contains:
                categoria,

              mode:
                'insensitive',
            },
          },
        },
      }),
    };

    const [modulos, total] =
      await this.prisma.$transaction([
        this.prisma.modulo.findMany({
          where,

          skip:
            (page - 1) *
            limit,

          take:
            limit,

          orderBy: {
            orden:
              'asc',
          },

          include: {
            curso: {
              select: {
                id: true,

                nombre:
                  true,

                categoria: {
                  select: {
                    nombre:
                      true,
                  },
                },
              },
            },

            precios: {
              orderBy: {
                creadoEn:
                  'desc',
              },

              take: 1,
            },

            descuentos: {
              where: {
                descuento: {
                  habilitado:
                    true,

                  iniciaEn: {
                    lte:
                      ahora,
                  },

                  finalizaEn: {
                    gte:
                      ahora,
                  },
                },
              },

              include: {
                descuento: {
                  select: {
                    id: true,

                    nombre:
                      true,

                    descripcion:
                      true,

                    tipo:
                      true,

                    valor:
                      true,

                    iniciaEn:
                      true,

                    finalizaEn:
                      true,
                  },
                },
              },
            },
          },
        }),

        this.prisma.modulo.count({
          where,
        }),
      ]);

    const data =
      modulos.map(
        (modulo) => {
          const {
            precios,
            descuentos,
            ...rest
          } = modulo;

          const precioActual =
            precios[0] ??
            null;

          const precio =
            this.calcularPrecio(
              precioActual,
              descuentos,
            );

          return {
            ...rest,
            ...precio,
          };
        },
      );

    return {
      data,

      meta: {
        total,
        page,
        limit,

        totalPages:
          Math.ceil(
            total / limit,
          ),
      },
    };
  }

  async findByCurso(
    cursoId: string,
    query: QueryModuloCursoDto,
  ) {
    const curso =
      await this.prisma.curso.findUnique({
        where: {
          id:
            cursoId,
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'Curso no encontrado',
      );
    }

    const {
      page = 1,
      limit = 10,
      nombre,
      estaPublicado,
    } = query;

    const ahora =
      new Date();

    const where:
      Prisma.ModuloWhereInput = {
      cursoId,

      ...(nombre && {
        nombre: {
          contains:
            nombre,

          mode:
            'insensitive',
        },
      }),

      estaPublicado:
        estaPublicado !==
          undefined
          ? estaPublicado
          : true,
    };

    const [modulos, total] =
      await this.prisma.$transaction([
        this.prisma.modulo.findMany({
          where,

          skip:
            (page - 1) *
            limit,

          take:
            limit,

          orderBy: {
            orden:
              'asc',
          },

          include: {
            precios: {
              orderBy: {
                creadoEn:
                  'desc',
              },

              take: 1,
            },

            descuentos: {
              where: {
                descuento: {
                  habilitado:
                    true,

                  iniciaEn: {
                    lte:
                      ahora,
                  },

                  finalizaEn: {
                    gte:
                      ahora,
                  },
                },
              },

              include: {
                descuento: {
                  select: {
                    id: true,

                    nombre:
                      true,

                    descripcion:
                      true,

                    tipo:
                      true,

                    valor:
                      true,

                    iniciaEn:
                      true,

                    finalizaEn:
                      true,
                  },
                },
              },
            },
          },
        }),

        this.prisma.modulo.count({
          where,
        }),
      ]);

    const data =
      modulos.map(
        (modulo) => {
          const {
            precios,
            descuentos,
            ...rest
          } = modulo;

          const precioActual =
            precios[0] ??
            null;

          const precio =
            this.calcularPrecio(
              precioActual,
              descuentos,
            );

          return {
            ...rest,
            ...precio,
          };
        },
      );

    return {
      data,

      meta: {
        total,
        page,
        limit,

        totalPages:
          Math.ceil(
            total / limit,
          ),
      },
    };
  }

  async findOne(
    id: string,
  ) {
    const ahora =
      new Date();

    const modulo =
      await this.prisma.modulo.findUnique({
        where: {
          id,
        },

        include: {
          curso: {
            select: {
              id: true,
              nombre: true,
              categoria: true,
            },
          },

          _count: {
            select: {
              lecciones:
                true,

              inscripciones:
                true,
            },
          },

          precios: {
            orderBy: {
              creadoEn:
                'desc',
            },

            take: 1,
          },

          descuentos: {
            where: {
              descuento: {
                habilitado:
                  true,

                iniciaEn: {
                  lte:
                    ahora,
                },

                finalizaEn: {
                  gte:
                    ahora,
                },
              },
            },

            include: {
              descuento: {
                select: {
                  id: true,

                  nombre:
                    true,

                  descripcion:
                    true,

                  tipo:
                    true,

                  valor:
                    true,

                  iniciaEn:
                    true,

                  finalizaEn:
                    true,
                },
              },
            },
          },
        },
      });

    if (!modulo) {
      throw new NotFoundException(
        'Módulo no encontrado',
      );
    }

    const {
      precios,
      descuentos,
      ...rest
    } = modulo;

    const precioActual =
      precios[0] ??
      null;

    const precio =
      this.calcularPrecio(
        precioActual,
        descuentos,
      );

    return {
      ...rest,
      ...precio,

      descuentoId:
        precio.descuento?.id ??
        null,
    };
  }

  async findLecciones(
    id: string,
  ) {
    await this.findOne(
      id,
    );

    return this.prisma.leccion.findMany({
      where: {
        moduloId:
          id,
      },

      orderBy: {
        orden:
          'asc',
      },
    });
  }

  async update(
    id: string,
    updateModuloDto: UpdateModuloDto,
    file?: Express.Multer.File,
    qrPagoBolivia?: Express.Multer.File,
  ) {
    const moduloActual =
      await this.findOne(
        id,
      );

    const {
      costo,
      urlPago,
      urlPagoBolivia,
      descuentoId,
      ...moduloData
    } = updateModuloDto;

    const actualizarDescuento =
      descuentoId !==
      undefined;

    if (
      actualizarDescuento &&
      descuentoId &&
      descuentoId.trim()
    ) {
      await this.validarDescuento(
        descuentoId,
      );
    }

    let rutaImagen:
      | string
      | undefined;

    if (file) {
      const imagen =
        await this.cloudinaryService.uploadImage(
          file,
          'lms/modulos',
        );

      rutaImagen =
        imagen.url;
    }

    let rutaQrPagoBolivia: string | undefined;

    if (qrPagoBolivia) {
      const imagenQr = await this.cloudinaryService.uploadImage(
        qrPagoBolivia,
        'lms/pagos/bolivia',
      );

      rutaQrPagoBolivia = imagenQr.url;
    }

    await this.prisma.modulo.update({
      where: {
        id,
      },

      data: {
        ...moduloData,

        ...(rutaImagen && {
          rutaImagen,
        }),
      },
    });

    const actualizarPrecio =
      costo !== undefined ||
      urlPago !== undefined ||
      urlPagoBolivia !== undefined ||
      rutaQrPagoBolivia !== undefined;

    if (actualizarPrecio) {
      await this.precioService.create({
        moduloId: id,
        costo: costo ?? moduloActual.costo ?? 0,
        urlPago: urlPago ?? moduloActual.urlPago ?? null,
        urlPagoBolivia:
          rutaQrPagoBolivia ??
          urlPagoBolivia ??
          moduloActual.urlPagoBolivia ??
          null,
      });
    }

    if (
      actualizarDescuento
    ) {
      await this.prisma.descuentoModulo.deleteMany({
        where: {
          moduloId:
            id,
        },
      });
      if (
        descuentoId &&
        descuentoId.trim()
      ) {
        await this.prisma.descuentoModulo.create({
          data: {
            moduloId:
              id,

            descuentoId,
          },
        });
      }
    }

    return this.findOne(
      id,
    );
  }

  async remove(
    id: string,
  ) {
    await this.findOne(
      id,
    );

    return this.prisma.modulo.update({
      where: {
        id,
      },

      data: {
        estaPublicado:
          false,
      },
    });
  }

  async restore(
    id: string,
  ) {
    await this.findOne(
      id,
    );

    return this.prisma.modulo.update({
      where: {
        id,
      },

      data: {
        estaPublicado:
          true,
      },
    });
  }
}