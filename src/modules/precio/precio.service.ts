import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePrecioDto } from './dto/create-precio.dto';

@Injectable()
export class PrecioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePrecioDto) {
    const modulo = await this.prisma.modulo.findUnique({
      where: { id: dto.moduloId },
    });

    if (!modulo) {
      throw new NotFoundException('El módulo indicado no existe');
    }

    return this.prisma.precio.create({
      data: {
        moduloId: dto.moduloId,
        costo: dto.costo,
      },
    });
  }

  async findLatestByModulo(moduloId: string) {
    return this.prisma.precio.findFirst({
      where: { moduloId },
      orderBy: { creadoEn: 'desc' },
    });
  }
}
