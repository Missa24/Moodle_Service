import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { QueryModuloDto } from './dto/query-modulo.dto';
import { QueryModuloCursoDto } from './dto/query-modulo-curso.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';


@Injectable()
export class ModuloService {
  constructor(private readonly prisma: PrismaService, private readonly cloudinaryService: CloudinaryService) { }

  async create(
    createModuloDto: CreateModuloDto,
    file?: Express.Multer.File,
  ) {
    const curso = await this.prisma.curso.findUnique({
      where: { id: createModuloDto.cursoId },
    });

    if (!curso) {
      throw new NotFoundException('El curso indicado no existe');
    }

    let rutaImagen: string | undefined;

    if (file) {
      const imagen = await this.cloudinaryService.uploadImage(
        file,
        'lms/modulos',
      );

      rutaImagen = imagen.url;
    }

    return this.prisma.modulo.create({
      data: {
        ...createModuloDto,
        rutaImagen,
      },
    });
  }

  async findAll(query: QueryModuloDto) {
    const { page = 1, limit = 10, nombre, categoria, cursoId, estaPublicado } = query;

    const where: Prisma.ModuloWhereInput = {
      ...(nombre && { nombre: { contains: nombre, mode: 'insensitive' } }),
      ...(cursoId && { cursoId }),
      ...(estaPublicado !== undefined && { estaPublicado }),
      ...(categoria && {
        curso: {
          categoria: {
            nombre: { contains: categoria, mode: 'insensitive' },
          }
        },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.modulo.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { orden: 'asc' },
        include: {
          curso: { select: { id: true, nombre: true, categoria: { select: { nombre: true } } } },
        },
      }),
      this.prisma.modulo.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByCurso(cursoId: string, query: QueryModuloCursoDto) {
    const curso = await this.prisma.curso.findUnique({ where: { id: cursoId } });

    if (!curso) {
      throw new NotFoundException('Curso no encontrado');
    }

    const { page = 1, limit = 10, nombre, estaPublicado } = query;

    const where: Prisma.ModuloWhereInput = {
      cursoId,
      ...(nombre && { nombre: { contains: nombre, mode: 'insensitive' } }),
      estaPublicado: estaPublicado !== undefined ? estaPublicado : true,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.modulo.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { orden: 'asc' },
      }),
      this.prisma.modulo.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const modulo = await this.prisma.modulo.findUnique({
      where: { id },
      include: {
        curso: { select: { id: true, nombre: true, categoria: true } },
        _count: { select: { lecciones: true, inscripciones: true } },
      },
    });

    if (!modulo) {
      throw new NotFoundException('Módulo no encontrado');
    }

    return modulo;
  }

  async findLecciones(id: string) {
    await this.findOne(id);

    return this.prisma.leccion.findMany({
      where: { moduloId: id },
      orderBy: { orden: 'asc' },
    });
  }

  async update(
    id: string,
    updateModuloDto: UpdateModuloDto,
    file?: Express.Multer.File,
  ) {
    await this.findOne(id);

    let rutaImagen: string | undefined;

    if (file) {
      const imagen = await this.cloudinaryService.uploadImage(
        file,
        'lms/modulos',
      );

      rutaImagen = imagen.url;
    }

    return this.prisma.modulo.update({
      where: { id },
      data: {
        ...updateModuloDto,

        ...(rutaImagen && {
          rutaImagen,
        }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.modulo.update({
      where: { id },
      data: { estaPublicado: false },
    });
  }

  async restore(id: string) {
    await this.findOne(id);

    return this.prisma.modulo.update({
      where: { id },
      data: { estaPublicado: true },
    });
  }
}