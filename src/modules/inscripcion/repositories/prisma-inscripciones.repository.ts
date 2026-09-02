import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InscripcionesRepository } from 'src/modules/inscripcion/repositories/inscripciones.repository';

@Injectable()
export class PrismaInscripcionesRepository
  implements InscripcionesRepository {
  constructor(private readonly prisma: PrismaService) { }

  private buildSearchFilter(search?: string) {
    if (!search?.trim()) return {};

    const palabras = search.trim().split(/\s+/);

    if (palabras.length === 1) {
      return {
        OR: [
          { perfil: { nombre: { contains: palabras[0], mode: 'insensitive' as const } } },
          { perfil: { apellidoPaterno: { contains: palabras[0], mode: 'insensitive' as const } } },
          { perfil: { apellidoMaterno: { contains: palabras[0], mode: 'insensitive' as const } } },
        ],
      };
    }

    return {
      AND: palabras.map(palabra => ({
        OR: [
          { perfil: { nombre: { contains: palabra, mode: 'insensitive' as const } } },
          { perfil: { apellidoPaterno: { contains: palabra, mode: 'insensitive' as const } } },
          { perfil: { apellidoMaterno: { contains: palabra, mode: 'insensitive' as const } } },
        ],
      })),
    };
  }

  async findAll() {
    return this.prisma.inscripcion.findMany({
      include: {
        modulo: {
          select: {
            nombre: true,
          }
        },
        estudiante: {
          select: {
            perfil: {
              select: {
                nombre: true,
              }
            }
          }
        }
      }
    });
  }

  async findById(id: string) {
    return this.prisma.inscripcion.findUnique({
      where: { id },
    });
  }

  async findByIdWithCurso(id: string) {
    return this.prisma.inscripcion.findUnique({
      where: { id },
      include: {
        modulo: {
          select: {
            id: true,
            nombre: true,
            orden: true,

            curso: {
              select: {
                id: true,
                nombre: true,
                categoria: {
                  select: {
                    nombre: true,
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  async create(data: {
    moduloId: string;
    estudianteId: string;
    numeroInscripcion: string;
  }) {
    return this.prisma.inscripcion.create({
      data,
    });
  }

  async update(id: string, inscripcion: any) {
    return this.prisma.inscripcion.update({
      where: { id },
      data: inscripcion,
    });
  }

  async delete(id: string) {
    await this.prisma.inscripcion.delete({
      where: { id },
    });
  }

  // obtener inscripciones paginado
  async findEstudianteWithInscripciones(skip: number, take: number, search?: string) {
    return this.prisma.usuario.findMany({
      where: {
        inscripciones: {
          some: {}
        },
        ...this.buildSearchFilter(search),
      },
      skip,
      take,
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        correo: true,
        estado: true,
        perfil: {
          select: {
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
          }
        },
        inscripciones: {
          orderBy: {
            modulo: {
              orden: "asc",
            }
          },
          select: {
            id: true,
            numeroInscripcion: true,
            estadoAcceso: true,
            modulo: {
              select: {
                id: true,
                nombre: true,
                orden: true,
                curso: {
                  select: {
                    id: true,
                    nombre: true,
                    categoria: {
                      select: {
                        nombre: true,
                      }
                    },
                  }
                }
              }
            }
          }
        }
      }
    });
  }
  async countEstudiantesWithInscripciones(search?: string) {
    return this.prisma.usuario.count({
      where: {
        inscripciones: {
          some: {}
        },
        ...this.buildSearchFilter(search),
      },
    });
  }

  // metodo crear inscripcion con varios pares estudiante-modulo
  async createMultiple(data: {
    inscripciones: {
      estudianteId: string;
      moduloId: string;
      numeroInscripcion: string;
    }[];
  }) {
    return this.prisma.inscripcion.createMany({
      data: data.inscripciones,
    });
  }

  // buscar estudiante con inscripciones por estudianteId si existe
  async findByEstudianteId(estudianteId: string) {
    return this.prisma.inscripcion.findMany({
      where: { estudianteId },
    });
  }

  // metodo obtener inscripciones de un estudiante por estudianteId
  async findByEstudianteInscripciones(estudianteId: string) {
    return this.prisma.inscripcion.findMany({
      where: { estudianteId },
      include: {
        modulo: {
          select: {
            id: true,
            nombre: true,
            orden: true,

            curso: {
              select: {
                id: true,
                nombre: true,
                categoria: {
                  select: {
                    nombre: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        modulo: {
          orden: 'asc',
        }
      }
    });
  }
}