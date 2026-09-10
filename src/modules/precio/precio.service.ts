import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePrecioDto } from './dto/create-precio.dto';

@Injectable()
export class PrecioService {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: CreatePrecioDto) {
    return this.prisma.precio.create({
      data: {
        moduloId: data.moduloId,
        costo: data.costo,
        urlPago: data.urlPago ?? null,
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
