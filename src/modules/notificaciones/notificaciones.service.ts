import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificacionesService {
  constructor(private readonly prisma: PrismaService) { }

  async crear(data: {
    usuarioId: string;
    tipo: string;
    titulo: string;
    contenido: string;
    urlAccion?: string;
  }) {
    return this.prisma.notificaciones.create({
      data: {
        usuarioId: data.usuarioId,
        tipo: data.tipo,
        titulo: data.titulo,
        contenido: data.contenido,
        urlAccion: data.urlAccion,
      },
    });
  }

  async crearUnica(data: {
    usuarioId: string;
    tipo: string;
    titulo: string;
    contenido: string;
    urlAccion?: string;
  }) {
    const existente = await this.prisma.notificaciones.findFirst({
      where: {
        usuarioId: data.usuarioId,
        tipo: data.tipo,
        titulo: data.titulo,
      },
    });

    if (existente) {
      return existente;
    }

    return this.crear(data);
  }

  async findByUsuarioId(usuarioId: string) {
    return this.prisma.notificaciones.findMany({
      where: {
        usuarioId,
      },
      orderBy: {
        creadoEn: 'desc',
      },
    });
  }

  async marcarComoLeida(
    notificacionId: string,
    usuarioId: string,
  ) {
    return this.prisma.notificaciones.updateMany({
      where: {
        id: notificacionId,
        usuarioId,
        leidaEn: null,
      },
      data: {
        leidaEn: new Date(),
        estado: 'leida',
      },
    });
  }

  async contarNoLeidas(usuarioId: string) {
    return this.prisma.notificaciones.count({
      where: {
        usuarioId,
        leidaEn: null,
      },
    });
  }
}