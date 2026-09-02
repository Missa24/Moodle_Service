import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriaService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateCategoriaDto) {
    if (dto.categoriaPadreId) {
      const padre = await this.prisma.categoria.findUnique({
        where: { id: dto.categoriaPadreId },
      });
      if (!padre) {
        throw new BadRequestException('La categoría padre indicada no existe');
      }
    }

    return this.prisma.categoria.create({ data: dto });
  }

  async findAll() {
    return this.prisma.categoria.findMany({
      where: { categoriaPadreId: null },
      include: {
        subcategorias: {
          select: { id: true, nombre: true, slug: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findSubCategorias(categoriaId: string) {
    await this.findOne(categoriaId);

    return this.prisma.categoria.findMany({
      where: { categoriaPadreId: categoriaId },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
      include: {
        subcategorias: { select: { id: true, nombre: true, slug: true } },
      },
    });

    if (!categoria) {
      throw new NotFoundException(`No se encontró la categoría con ID: ${id}`);
    }

    return categoria;
  }

  async update(id: string, dto: UpdateCategoriaDto) {
    await this.findOne(id);

    if (dto.categoriaPadreId === id) {
      throw new BadRequestException('Una categoría no puede ser su propia categoría padre');
    }

    return this.prisma.categoria.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const cursosAsociados = await this.prisma.curso.count({
      where: { categoriaId: id },
    });

    if (cursosAsociados > 0) {
      throw new BadRequestException(
        'No se puede eliminar la categoría porque tiene cursos asociados',
      );
    }

    const subcategorias = await this.prisma.categoria.count({
      where: { categoriaPadreId: id },
    });

    if (subcategorias > 0) {
      throw new BadRequestException(
        'No se puede eliminar la categoría porque tiene subcategorías asociadas',
      );
    }

    return this.prisma.categoria.delete({ where: { id } });
  }
}