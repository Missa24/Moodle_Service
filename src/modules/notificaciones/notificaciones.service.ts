import { Injectable, NotFoundException } from '@nestjs/common';
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

  async notificarInscripcion(data: {
    usuarioId: string;
    cursoNombre: string;
    moduloNombre: string;
    moduloId: string;
  }) {
    return this.crear({
      usuarioId: data.usuarioId,
      tipo: 'INSCRIPCION',
      titulo: '¡Ya estás inscrito!',
      contenido: `Fuiste inscrito al módulo ${data.moduloNombre} del curso ${data.cursoNombre}.`,
      urlAccion: `/panel/cursos/${data.moduloId}`,
    });
  }

  async findByUsuarioId(usuarioId: string) {
    return this.prisma.notificaciones.findMany({
      where: { usuarioId },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async findPendientesByUsuarioId(usuarioId: string) {
    return this.prisma.notificaciones.findMany({
      where: {
        usuarioId,
        leidaEn: null,
        estado: 'pendiente',
      },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async marcarComoLeida(notificacionId: string, usuarioId: string) {
    const notificacion = await this.prisma.notificaciones.findFirst({
      where: {
        id: notificacionId,
        usuarioId,
      },
    });

    if (!notificacion) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return this.prisma.notificaciones.update({
      where: { id: notificacionId },
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
  async notificarLeadRegistrado(data: {
    leadId: string;
    cursoNombre?: string;
    usuarioNombre?: string;
  }) {
    const admins = await this.prisma.usuarioRol.findMany({
      where: {
        rol: {
          nombre: 'ADMIN',
        },
      },
      select: {
        usuarioId: true,
      },
    });

    return Promise.all(
      admins.map((admin) =>
        this.crear({
          usuarioId: admin.usuarioId,
          tipo: 'LEAD_REGISTRADO',
          titulo: 'Nuevo lead registrado',
          contenido: data.usuarioNombre
            ? `${data.usuarioNombre} ha registrado un nuevo lead${data.cursoNombre
              ? ` para el curso ${data.cursoNombre}`
              : ''
            }.`
            : `Se ha registrado un nuevo lead${data.cursoNombre
              ? ` para el curso ${data.cursoNombre}`
              : ''
            }.`,
          urlAccion: `/panel/leads/${data.leadId}`,
        }),
      ),
    );
  }

}