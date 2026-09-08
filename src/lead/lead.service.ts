import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(
    usuarioId: string,
    moduloId: string,
  ) {
    const modulo =
      await this.prisma.modulo.findUnique({
        where: {
          id: moduloId,
        },
      });

    if (!modulo) {
      throw new BadRequestException(
        'El módulo indicado no existe',
      );
    }

    const leadExistente =
      await this.prisma.lead.findUnique({
        where: {
          usuarioId_moduloId: {
            usuarioId,
            moduloId,
          },
        },
      });

    if (leadExistente) {
      await this.prisma.lead.update({
        where: {
          id: leadExistente.id,
        },
        data: {
          ultimoIntentoEn: new Date(),
        },
      });

      return {
        ok: true,
      };
    }

    await this.prisma.lead.create({
      data: {
        usuarioId,
        moduloId,
      },
    });

    return {
      ok: true,
    };
  }

  async findAll() {
    const leads =
      await this.prisma.lead.findMany({
        orderBy: {
          ultimoIntentoEn: 'desc',
        },

        select: {
          id: true,
          estado: true,
          creadoEn: true,
          actualizadoEn: true,
          ultimoIntentoEn: true,
          convertidoEn: true,

          usuario: {
            select: {
              id: true,
              correo: true,

              perfil: {
                select: {
                  nombre: true,
                  apellidoPaterno: true,
                  apellidoMaterno: true,
                  telefono: true,
                  ciudad: true,
                  pais: true,
                  paisCodigo: true,
                },
              },
            },
          },

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
      });

    return leads.map((lead) => ({
      id: lead.id,

      nombre:
        lead.usuario.perfil?.nombre ?? '',

      apellidoPaterno:
        lead.usuario.perfil?.apellidoPaterno ?? '',

      apellidoMaterno:
        lead.usuario.perfil?.apellidoMaterno ?? '',

      correo:
        lead.usuario.correo,

      telefono:
        lead.usuario.perfil?.telefono ?? '',

      ciudad:
        lead.usuario.perfil?.ciudad ?? '',

      pais:
        lead.usuario.perfil?.pais ?? '',

      paisCodigo:
        lead.usuario.perfil?.paisCodigo ?? '',

      curso: {
        id: lead.modulo.curso.id,
        nombre: lead.modulo.curso.nombre,
      },

      modulo: {
        id: lead.modulo.id,
        nombre: lead.modulo.nombre,
      },

      estado: lead.estado,

      creadoEn: lead.creadoEn,

      ultimoIntentoEn: lead.ultimoIntentoEn,

      convertidoEn: lead.convertidoEn,
    }));
  }
}