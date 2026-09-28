import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Prisma,
  TipoDescuentoCurso,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { ConfigurarVentaCursoDto } from './dto/configurar-venta-curso.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class CursoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async create(
    createCursoDto: CreateCursoDto,
    portada?: Express.Multer.File,
    secundaria?: Express.Multer.File,
  ) {
    let rutaPortada: string | undefined;
    let rutaImagenSecundaria: string | undefined;

    if (portada) {
      const imagen =
        await this.cloudinaryService.uploadImage(
          portada,
          'lms/cursos',
        );

      rutaPortada = imagen.url;
    }

    if (secundaria) {
      const imagen =
        await this.cloudinaryService.uploadImage(
          secundaria,
          'lms/cursos',
        );

      rutaImagenSecundaria = imagen.url;
    }

    return this.prisma.curso.create({
      data: {
        ...createCursoDto,
        rutaPortada,
        rutaImagenSecundaria,
      },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    categoriaId?: string,
    conDescuento: boolean = false,
  ) {
    const pagina =
      Math.max(page, 1);

    const limite =
      Math.min(
        Math.max(limit, 1),
        50,
      );

    const skip =
      (pagina - 1) * limite;

    let filtroCategoria:
      Prisma.CursoWhereInput = {};

    if (categoriaId) {
      const categoria =
        await this.prisma.categoria.findUnique({
          where: {
            id: categoriaId,
          },

          select: {
            id: true,
            categoriaPadreId: true,
          },
        });

      if (categoria) {
        if (
          categoria.categoriaPadreId ===
          null
        ) {
          filtroCategoria = {
            OR: [
              {
                categoriaId:
                  categoria.id,
              },

              {
                categoria: {
                  categoriaPadreId:
                    categoria.id,
                },
              },
            ],
          };
        } else {
          filtroCategoria = {
            categoriaId:
              categoria.id,
          };
        }
      }
    }

    const where:
      Prisma.CursoWhereInput = {
      estado: 'publicado',

      ...(search?.trim()
        ? {
          OR: [
            {
              nombre: {
                contains:
                  search.trim(),

                mode:
                  'insensitive',
              },
            },

            {
              descripcionCorta: {
                contains:
                  search.trim(),

                mode:
                  'insensitive',
              },
            },

            {
              descripcionCompleta: {
                contains:
                  search.trim(),

                mode:
                  'insensitive',
              },
            },
          ],
        }
        : {}),

      ...filtroCategoria,

      ...(conDescuento
        ? {
          configuracionVenta: {
            is: {
              habilitado: true,
            },
          },
        }
        : {}),
    };

    const [
      cursos,
      total,
    ] = await Promise.all([
      this.prisma.curso.findMany({
        where,

        skip,

        take:
          limite,

        orderBy: {
          creadoEn:
            'desc',
        },

        include: {
          categoria: {
            select: {
              id: true,
              nombre: true,
              slug: true,
            },
          },

          configuracionVenta:
            true,

          modulos: {
            where: {
              estaPublicado:
                true,
            },

            orderBy: {
              orden:
                'asc',
            },

            select: {
              id: true,
              nombre: true,
              orden: true,

              precios: {
                orderBy: {
                  creadoEn:
                    'desc',
                },

                take: 1,

                select: {
                  costo: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.curso.count({
        where,
      }),
    ]);

    const data =
      cursos.map((curso) => {
        const precio =
          this.calcularPrecioDesdeDatos(
            curso.modulos,
            curso.configuracionVenta,
          );

        return {
          ...curso,

          precioCurso:
            precio,
        };
      });

    const totalPaginas =
      Math.ceil(
        total / limite,
      );

    return {
      data,

      meta: {
        page:
          pagina,

        limit:
          limite,

        total,

        totalPages:
          totalPaginas,
      },
    };
  }

  async findOne(id: string) {
    const curso =
      await this.prisma.curso.findUnique({
        where: {
          id,
        },

        include: {
          categoria: {
            select: {
              id: true,
              nombre: true,
              slug: true,
            },
          },

          configuracionVenta:
            true,

          modulos: {
            where: {
              estaPublicado:
                true,
            },

            orderBy: {
              orden:
                'asc',
            },

            select: {
              id: true,
              nombre: true,
              orden: true,

              precios: {
                orderBy: {
                  creadoEn:
                    'desc',
                },

                take: 1,

                select: {
                  costo: true,
                },
              },
            },
          },
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'Curso no encontrado',
      );
    }

    const precio =
      this.calcularPrecioDesdeDatos(
        curso.modulos,
        curso.configuracionVenta,
      );

    return {
      ...curso,

      precioCurso:
        precio,
    };
  }

  async findOneBySlug(
    slug: string,
  ) {
    const curso =
      await this.prisma.curso.findFirst({
        where: {
          slug,

          estado:
            'publicado',
        },

        include: {
          categoria: {
            select: {
              id: true,
              nombre: true,
              slug: true,
            },
          },

          configuracionVenta:
            true,

          modulos: {
            where: {
              estaPublicado:
                true,
            },

            orderBy: {
              orden:
                'asc',
            },

            select: {
              id: true,
              nombre: true,
              orden: true,

              precios: {
                orderBy: {
                  creadoEn:
                    'desc',
                },

                take: 1,

                select: {
                  costo: true,
                },
              },
            },
          },
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'Curso no encontrado',
      );
    }

    const precio =
      this.calcularPrecioDesdeDatos(
        curso.modulos,
        curso.configuracionVenta,
      );

    return {
      ...curso,

      precioCurso:
        precio,
    };
  }

  async obtenerPrecioCurso(
    cursoId: string,
  ) {
    const curso =
      await this.prisma.curso.findUnique({
        where: {
          id: cursoId,
        },

        select: {
          id: true,
          nombre: true,
          estado: true,

          configuracionVenta:
            true,

          modulos: {
            where: {
              estaPublicado:
                true,
            },

            orderBy: {
              orden:
                'asc',
            },

            select: {
              id: true,
              nombre: true,
              orden: true,

              precios: {
                orderBy: {
                  creadoEn:
                    'desc',
                },

                take: 1,

                select: {
                  costo: true,
                  urlPago: true,
                  urlPagoBolivia:
                    true,
                  creadoEn: true,
                },
              },
            },
          },
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'Curso no encontrado',
      );
    }

    if (
      curso.modulos.length ===
      0
    ) {
      throw new BadRequestException(
        'El curso no tiene módulos publicados',
      );
    }

    const modulosSinPrecio =
      curso.modulos.filter(
        (modulo) =>
          modulo.precios.length ===
          0,
      );

    if (
      modulosSinPrecio.length >
      0
    ) {
      throw new BadRequestException(
        `Los siguientes módulos no tienen precio: ${modulosSinPrecio
          .map(
            (modulo) =>
              modulo.nombre,
          )
          .join(', ')}`,
      );
    }

    const precio =
      this.calcularPrecioDesdeDatos(
        curso.modulos,
        curso.configuracionVenta,
      );

    if (!precio) {
      throw new BadRequestException(
        'No se pudo calcular el precio del curso',
      );
    }

    return {
      cursoId:
        curso.id,

      nombre:
        curso.nombre,

      ...precio,
    };
  }

  async configurarVentaCurso(
    cursoId: string,
    data: ConfigurarVentaCursoDto,
    qrPagoBolivia?: Express.Multer.File,
  ) {
    const curso =
      await this.prisma.curso.findUnique({
        where: {
          id: cursoId,
        },
        select: {
          id: true,

          modulos: {
            where: {
              estaPublicado: true,
            },
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'Curso no encontrado',
      );
    }

    if (
      data.tipoDescuento ===
      TipoDescuentoCurso.PORCENTAJE
    ) {
      if (
        data.porcentaje === undefined ||
        data.porcentaje <= 0 ||
        data.porcentaje > 100
      ) {
        throw new BadRequestException(
          'El porcentaje debe ser mayor a 0 y menor o igual a 100',
        );
      }
    }

    if (
      data.tipoDescuento ===
      TipoDescuentoCurso.MODULO_GRATIS
    ) {
      if (!data.moduloDescuentoId) {
        throw new BadRequestException(
          'Debe seleccionar el módulo que será descontado',
        );
      }

      const moduloPertenece =
        curso.modulos.some(
          (modulo) =>
            modulo.id ===
            data.moduloDescuentoId,
        );

      if (!moduloPertenece) {
        throw new BadRequestException(
          'El módulo seleccionado no pertenece a los módulos publicados del curso',
        );
      }

      const precioModulo =
        await this.prisma.precio.findFirst({
          where: {
            moduloId:
              data.moduloDescuentoId,
          },
          orderBy: {
            creadoEn: 'desc',
          },
          select: {
            id: true,
          },
        });

      if (!precioModulo) {
        throw new BadRequestException(
          'El módulo seleccionado no tiene un precio registrado',
        );
      }
    }

    if (
      qrPagoBolivia &&
      !qrPagoBolivia.mimetype.startsWith(
        'image/',
      )
    ) {
      throw new BadRequestException(
        'El QR de Bolivia debe ser una imagen',
      );
    }

    const configuracionActual =
      await this.prisma.configuracionVentaCurso.findUnique({
        where: {
          cursoId,
        },
        select: {
          urlPagoBolivia: true,
          publicIdPagoBolivia: true,
        },
      });

    let nuevaImagen:
      | {
        url: string;
        publicId: string;
      }
      | null = null;

    if (qrPagoBolivia) {
      nuevaImagen =
        await this.cloudinaryService.uploadImage(
          qrPagoBolivia,
          'lms/cursos/qr-pagos',
        );
    }

    const urlPago =
      data.urlPago !== undefined
        ? data.urlPago.trim() || null
        : undefined;

    try {
      const configuracion =
        await this.prisma.configuracionVentaCurso.upsert({
          where: {
            cursoId,
          },

          update: {
            tipoDescuento:
              data.tipoDescuento,

            porcentaje:
              data.tipoDescuento ===
                TipoDescuentoCurso.PORCENTAJE
                ? data.porcentaje
                : null,

            moduloDescuentoId:
              data.tipoDescuento ===
                TipoDescuentoCurso.MODULO_GRATIS
                ? data.moduloDescuentoId
                : null,

            ...(data.urlPago !==
              undefined
              ? {
                urlPago,
              }
              : {}),

            ...(nuevaImagen
              ? {
                urlPagoBolivia:
                  nuevaImagen.url,

                publicIdPagoBolivia:
                  nuevaImagen.publicId,
              }
              : {}),

            ...(data.habilitado !==
              undefined
              ? {
                habilitado:
                  data.habilitado,
              }
              : {}),
          },

          create: {
            cursoId,

            tipoDescuento:
              data.tipoDescuento,

            porcentaje:
              data.tipoDescuento ===
                TipoDescuentoCurso.PORCENTAJE
                ? data.porcentaje
                : null,

            moduloDescuentoId:
              data.tipoDescuento ===
                TipoDescuentoCurso.MODULO_GRATIS
                ? data.moduloDescuentoId
                : null,

            urlPago:
              data.urlPago?.trim() ||
              null,

            urlPagoBolivia:
              nuevaImagen?.url ??
              null,

            publicIdPagoBolivia:
              nuevaImagen?.publicId ??
              null,

            habilitado:
              data.habilitado ??
              true,
          },
        });

      if (
        nuevaImagen &&
        configuracionActual
          ?.publicIdPagoBolivia &&
        configuracionActual
          .publicIdPagoBolivia !==
        nuevaImagen.publicId
      ) {
        this.cloudinaryService
          .deleteImage(
            configuracionActual.publicIdPagoBolivia,
          )
          .catch(() => undefined);
      }

      return {
        configuracion,

        precio:
          await this.obtenerPrecioCurso(
            cursoId,
          ),
      };
    } catch (error) {
      if (nuevaImagen) {
        await this.cloudinaryService
          .deleteImage(
            nuevaImagen.publicId,
          )
          .catch(() => undefined);
      }

      throw error;
    }
  }

  async obtenerConfiguracionVentaCurso(
    cursoId: string,
  ) {
    const curso =
      await this.prisma.curso.findUnique({
        where: {
          id: cursoId,
        },

        select: {
          id: true,
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'Curso no encontrado',
      );
    }

    return this.prisma.configuracionVentaCurso.findUnique({
      where: {
        cursoId,
      },

      include: {
        moduloDescuento: {
          select: {
            id: true,
            nombre: true,
            orden: true,
          },
        },
      },
    });
  }

  async findModulos(
    id: string,
  ) {
    const existe =
      await this.prisma.curso.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
        },
      });

    if (!existe) {
      throw new NotFoundException(
        'Curso no encontrado',
      );
    }

    return this.prisma.modulo.findMany({
      where: {
        cursoId: id,
      },

      orderBy: {
        orden:
          'asc',
      },
    });
  }

  async update(
    id: string,
    updateCursoDto: UpdateCursoDto,
    portada?: Express.Multer.File,
    secundaria?: Express.Multer.File,
  ) {
    const existe =
      await this.prisma.curso.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
        },
      });

    if (!existe) {
      throw new NotFoundException(
        'Curso no encontrado',
      );
    }

    let rutaPortada:
      string | undefined;

    let rutaImagenSecundaria:
      string | undefined;

    if (portada) {
      const imagen =
        await this.cloudinaryService.uploadImage(
          portada,
          'lms/cursos',
        );

      rutaPortada =
        imagen.url;
    }

    if (secundaria) {
      const imagen =
        await this.cloudinaryService.uploadImage(
          secundaria,
          'lms/cursos',
        );

      rutaImagenSecundaria =
        imagen.url;
    }

    return this.prisma.curso.update({
      where: {
        id,
      },

      data: {
        ...updateCursoDto,

        ...(rutaPortada && {
          rutaPortada,
        }),

        ...(rutaImagenSecundaria && {
          rutaImagenSecundaria,
        }),
      },
    });
  }

  async remove(id: string) {
    const existe =
      await this.prisma.curso.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
        },
      });

    if (!existe) {
      throw new NotFoundException(
        'Curso no encontrado',
      );
    }

    return this.prisma.curso.update({
      where: {
        id,
      },

      data: {
        estado:
          'inactivo',
      },
    });
  }

  async obtenerCursos() {
    return this.prisma.curso.findMany({
      select: {
        id: true,
        nombre: true,

        modulos: {
          select: {
            id: true,
            nombre: true,
          },

          orderBy: {
            orden:
              'asc',
          },
        },
      },
    });
  }

  async subirImagenCurso(
    file: Express.Multer.File,
    cursoId: string,
  ) {
    const curso =
      await this.prisma.curso.findUnique({
        where: {
          id: cursoId,
        },

        select: {
          id: true,
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'Curso no encontrado',
      );
    }

    const imagen =
      await this.cloudinaryService.uploadImage(
        file,
        'lms/cursos',
      );

    return this.prisma.curso.update({
      where: {
        id: cursoId,
      },

      data: {
        rutaPortada:
          imagen.url,
      },
    });
  }

  private calcularPrecioDesdeDatos(
    modulos: Array<{
      id: string;
      nombre: string;
      orden: number;
      precios: Array<{
        costo: Prisma.Decimal;
      }>;
    }>,
    configuracion:
      | {
        tipoDescuento:
        TipoDescuentoCurso;

        porcentaje:
        Prisma.Decimal | null;

        moduloDescuentoId:
        string | null;

        urlPago:
        string | null;

        urlPagoBolivia:
        string | null;

        habilitado:
        boolean;
      }
      | null,
  ) {
    if (
      modulos.length ===
      0
    ) {
      return null;
    }

    const tieneTodosLosPrecios =
      modulos.every(
        (modulo) =>
          modulo.precios.length >
          0,
      );

    if (
      !tieneTodosLosPrecios
    ) {
      return null;
    }

    const modulosConPrecio =
      modulos.map(
        (modulo) => ({
          id:
            modulo.id,

          nombre:
            modulo.nombre,

          orden:
            modulo.orden,

          precio:
            new Prisma.Decimal(
              modulo.precios[0]
                .costo,
            ),
        }),
      );

    const precioBase =
      modulosConPrecio.reduce(
        (
          total,
          modulo,
        ) =>
          total.plus(
            modulo.precio,
          ),

        new Prisma.Decimal(0),
      );

    let montoDescuento =
      new Prisma.Decimal(0);

    let detalleDescuento:
      | {
        tipo:
        TipoDescuentoCurso;

        porcentaje?:
        number;

        modulo?:
        {
          id:
          string;

          nombre:
          string;

          precio:
          number;
        };
      }
      | null = null;

    if (
      configuracion?.habilitado
    ) {
      if (
        configuracion.tipoDescuento ===
        TipoDescuentoCurso.PORCENTAJE
      ) {
        const porcentaje =
          configuracion.porcentaje ??
          new Prisma.Decimal(0);

        montoDescuento =
          precioBase
            .mul(
              porcentaje,
            )
            .div(100);

        detalleDescuento = {
          tipo:
            TipoDescuentoCurso.PORCENTAJE,

          porcentaje:
            Number(
              porcentaje,
            ),
        };
      }

      if (
        configuracion.tipoDescuento ===
        TipoDescuentoCurso.MODULO_GRATIS
      ) {
        const moduloGratis =
          modulosConPrecio.find(
            (modulo) =>
              modulo.id ===
              configuracion.moduloDescuentoId,
          );

        if (moduloGratis) {
          montoDescuento =
            moduloGratis.precio;

          detalleDescuento = {
            tipo:
              TipoDescuentoCurso.MODULO_GRATIS,

            modulo: {
              id:
                moduloGratis.id,

              nombre:
                moduloGratis.nombre,

              precio:
                Number(
                  moduloGratis.precio,
                ),
            },
          };
        }
      }
    }

    let precioFinal =
      precioBase.minus(
        montoDescuento,
      );

    if (
      precioFinal.lessThan(0)
    ) {
      precioFinal =
        new Prisma.Decimal(0);
    }

    return {
      modulos:
        modulosConPrecio.map(
          (modulo) => ({
            id:
              modulo.id,

            nombre:
              modulo.nombre,

            orden:
              modulo.orden,

            precio:
              Number(
                modulo.precio,
              ),
          }),
        ),

      precioBase:
        Number(
          precioBase,
        ),

      descuento:
        detalleDescuento,

      montoDescuento:
        Number(
          montoDescuento,
        ),

      precioFinal:
        Number(
          precioFinal,
        ),

      pago: {
        urlPago:
          configuracion?.urlPago ??
          null,

        urlPagoBolivia:
          configuracion
            ?.urlPagoBolivia ??
          null,
      },

      habilitado:
        configuracion
          ?.habilitado ??
        false,
    };
  }
}