import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { QueryModuloDto } from './dto/query-modulo.dto';
import { QueryModuloCursoDto } from './dto/query-modulo-curso.dto';

import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrecioService } from '../precio/precio.service';

@Injectable()
export class ModuloService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly precioService: PrecioService,
  ) { }

  async create(
    createModuloDto: CreateModuloDto,
    file?: Express.Multer.File,
  ) {
    const curso = await this.prisma.curso.findUnique({
      where: {
        id: createModuloDto.cursoId,
      },
    });

    if (!curso) {
      throw new NotFoundException(
        'El curso indicado no existe',
      );
    }

    let rutaImagen: string | undefined;

    if (file) {
      const imagen =
        await this.cloudinaryService.uploadImage(
          file,
          'lms/modulos',
        );

      rutaImagen = imagen.url;
    }

    const {
      costo,
      urlPago,
      ...moduloData
    } = createModuloDto;

    const modulo = await this.prisma.modulo.create({
      data: {
        ...moduloData,
        rutaImagen,
      },
    });

    if (
      costo !== undefined ||
      urlPago !== undefined
    ) {
      await this.precioService.create({
        moduloId: modulo.id,
        costo: costo ?? 0,
        urlPago: urlPago ?? null,
      });
    }

    return this.findOne(modulo.id);
  }

  async findAll(query: QueryModuloDto) {
    const {
      page = 1,
      limit = 10,
      nombre,
      categoria,
      cursoId,
      estaPublicado,
    } = query;

    const where: Prisma.ModuloWhereInput = {
      ...(nombre && {
        nombre: {
          contains: nombre,
          mode: 'insensitive',
        },
      }),

      ...(cursoId && {
        cursoId,
      }),

      ...(estaPublicado !== undefined && {
        estaPublicado,
      }),

      ...(categoria && {
        curso: {
          categoria: {
            nombre: {
              contains: categoria,
              mode: 'insensitive',
            },
          },
        },
      }),
    };

    const [modulos, total] =
      await this.prisma.$transaction([
        this.prisma.modulo.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,

          orderBy: {
            orden: 'asc',
          },

          include: {
            curso: {
              select: {
                id: true,
                nombre: true,

                categoria: {
                  select: {
                    nombre: true,
                  },
                },
              },
            },

            precios: {
              orderBy: {
                creadoEn: 'desc',
              },

              take: 1,
            },
          },
        }),

        this.prisma.modulo.count({
          where,
        }),
      ]);

    const data = modulos.map((modulo) => {
      const {
        precios,
        ...rest
      } = modulo;

      const precioActual =
        precios[0] ?? null;

      return {
        ...rest,

        costo: precioActual
          ? Number(precioActual.costo)
          : null,

        urlPago:
          precioActual?.urlPago ?? null,
      };
    });

    return {
      data,

      meta: {
        total,
        page,
        limit,
        totalPages:
          Math.ceil(total / limit),
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
          id: cursoId,
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

    const where: Prisma.ModuloWhereInput = {
      cursoId,

      ...(nombre && {
        nombre: {
          contains: nombre,
          mode: 'insensitive',
        },
      }),

      estaPublicado:
        estaPublicado !== undefined
          ? estaPublicado
          : true,
    };

    const [modulos, total] =
      await this.prisma.$transaction([
        this.prisma.modulo.findMany({
          where,

          skip: (page - 1) * limit,
          take: limit,

          orderBy: {
            orden: 'asc',
          },

          include: {
            precios: {
              orderBy: {
                creadoEn: 'desc',
              },

              take: 1,
            },
          },
        }),

        this.prisma.modulo.count({
          where,
        }),
      ]);

    const data = modulos.map((modulo) => {
      const {
        precios,
        ...rest
      } = modulo;

      const precioActual =
        precios[0] ?? null;

      return {
        ...rest,

        costo: precioActual
          ? Number(precioActual.costo)
          : null,

        urlPago:
          precioActual?.urlPago ?? null,
      };
    });

    return {
      data,

      meta: {
        total,
        page,
        limit,
        totalPages:
          Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
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
              lecciones: true,
              inscripciones: true,
            },
          },

          precios: {
            orderBy: {
              creadoEn: 'desc',
            },

            take: 1,
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
      ...rest
    } = modulo;

    const precioActual =
      precios[0] ?? null;

    return {
      ...rest,

      costo: precioActual
        ? Number(precioActual.costo)
        : null,

      urlPago:
        precioActual?.urlPago ?? null,
    };
  }

  async findLecciones(id: string) {
    await this.findOne(id);

    return this.prisma.leccion.findMany({
      where: {
        moduloId: id,
      },

      orderBy: {
        orden: 'asc',
      },
    });
  }

  async update(
    id: string,
    updateModuloDto: UpdateModuloDto,
    file?: Express.Multer.File,
  ) {
    const moduloActual =
      await this.findOne(id);

    let rutaImagen:
      | string
      | undefined;

    if (file) {
      const imagen =
        await this.cloudinaryService.uploadImage(
          file,
          'lms/modulos',
        );

      rutaImagen = imagen.url;
    }

    const {
      costo,
      urlPago,
      ...moduloData
    } = updateModuloDto;

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
      urlPago !== undefined;

    if (actualizarPrecio) {
      await this.precioService.create({
        moduloId: id,

        costo:
          costo ??
          moduloActual.costo ??
          0,

        urlPago:
          urlPago ??
          moduloActual.urlPago ??
          null,
      });
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.modulo.update({
      where: {
        id,
      },

      data: {
        estaPublicado: false,
      },
    });
  }

  async restore(id: string) {
    await this.findOne(id);

    return this.prisma.modulo.update({
      where: {
        id,
      },

      data: {
        estaPublicado: true,
      },
    });
  }
}