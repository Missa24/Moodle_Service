import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateMiPerfilDto, UpdateUsuarioDto } from './dto/update-user.dto';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CambiarMiPasswordDto, ChangePasswordUserDto } from './dto/change-password';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class UserService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService
  ) { };

  private async generateUsername(
    nombre: string,
    apellidoPaterno: string,
    apellidoMaterno: string,
  ): Promise<string> {
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, '.')
        .replace(/[^a-z.]/g, '');

    const nombreNormalizado = normalize(nombre);
    const apellido1Normalizado = normalize(apellidoPaterno);
    const apellido2Normalizado = normalize(apellidoMaterno);
    const iniciales = apellido1Normalizado.charAt(0) + apellido2Normalizado.charAt(0);
    const baseUsername = `${iniciales}${nombreNormalizado}`.toLowerCase();
    let username = baseUsername;
    let contador = 1;

    while (
      await this.prisma.usuario.findUnique({
        where: { username },
        select: { id: true },
      })
    ) {
      username = `${baseUsername}${contador}`;
      contador++;
    }

    return username;
  }

  private async hashPassword(
    password: string,
  ): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async getStudentRole() {
    const role = await this.prisma.rol.findUnique({
      where: {
        nombre: 'ESTUDIANTE',
      },
      select: {
        id: true,
      },
    });

    if (!role) {
      throw new Error(
        'El rol ESTUDIANTE no está configurado',
      );
    }

    return role;
  }

  async create(createUserDto: CreateUserDto) {
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      correo,
      numeroDocumento,
      rolId,
    } = createUserDto;

    const baseUsername = `${nombre}.${apellidoPaterno}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.]/g, '');

    let username = baseUsername;
    let contador = 1;

    while (
      await this.prisma.usuario.findUnique({
        where: { username },
      })
    ) {
      username = `${baseUsername}${contador}`;
      contador++;
    }
    const contrasenaHash = await bcrypt.hash(
      numeroDocumento,
      10,
    );
    const usuario = await this.prisma.$transaction(
      async (tx) => {
        const nuevoUsuario = await tx.usuario.create({
          data: {
            username,
            correo,
            contrasenaHash,
            estado: 'pendiente',

            perfil: {
              create: {
                nombre,
                apellidoPaterno,
                apellidoMaterno,
                numeroDocumento,
              },
            },
          },
        });

        await tx.usuarioRol.create({
          data: {
            usuarioId: nuevoUsuario.id,
            rolId,
          },
        });

        return nuevoUsuario;
      },
    );

    return {
      id: usuario.id,
      username: usuario.username,
      correo: usuario.correo,
      estado: usuario.estado,
    };
  }

  async createStudent(createStudentDto: CreateStudentDto) {
    const { nombre, apellidoPaterno, apellidoMaterno, correo, numeroDocumento } = createStudentDto;
    const username = await this.generateUsername(nombre, apellidoPaterno, apellidoMaterno);
    const contrasenaHash = await this.hashPassword(numeroDocumento);
    const studentRole = await this.getStudentRole();

    const usuario = await this.prisma.$transaction(
      async (tx) => {
        const nuevoUsuario = await tx.usuario.create({
          data: {
            username,
            correo,
            contrasenaHash,
            estado: 'pendiente',

            perfil: {
              create: {
                nombre,
                numeroDocumento,
              },
            },
          },
        });

        await tx.usuarioRol.create({
          data: {
            usuarioId: nuevoUsuario.id,
            rolId: studentRole.id,
          },
        });

        return nuevoUsuario;
      },
    );

    return {
      id: usuario.id,
      username: usuario.username,
      correo: usuario.correo,
      estado: usuario.estado,
    };
  }

  findAll() {
    return `This action returns all user`;
  }

  async findOne(id: string) {
    return await this.prisma.usuario.findUnique({
      where: {
        id: id.toString(),
      },
    });
  }

  async actualizarUsuario(id: string, data: UpdateUsuarioDto) {
    return await this.prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: {
          id,
        },
        data: {
          ...(data.correo !== undefined && {
            correo: data.correo,
          }),
          ...(data.username !== undefined && {
            username: data.username,
          }),
          ...(data.estado !== undefined && {
            estado: data.estado,
          }),
        },
      });

      const fechaNacimiento = data.fechaNacimiento
        ? new Date(data.fechaNacimiento)
        : null;

      const fechaNacimientoValida =
        fechaNacimiento &&
          !Number.isNaN(fechaNacimiento.getTime())
          ? fechaNacimiento
          : null;

      await tx.perfil.upsert({
        where: {
          usuarioId: id,
        },
        update: {
          ...(data.nombre !== undefined && {
            nombre: data.nombre,
          }),
          ...(data.apellidoPaterno !== undefined && {
            apellidoPaterno: data.apellidoPaterno,
          }),
          ...(data.apellidoMaterno !== undefined && {
            apellidoMaterno: data.apellidoMaterno,
          }),
          ...(data.tipoDocumentoIdentidad !== undefined && {
            tipoDocumentoIdentidad:
              data.tipoDocumentoIdentidad,
          }),
          ...(data.numeroDocumento !== undefined && {
            numeroDocumento: data.numeroDocumento,
          }),
          ...(data.telefono !== undefined && {
            telefono: data.telefono,
          }),
          ...(data.fechaNacimiento !== undefined && {
            fechaNacimiento: fechaNacimientoValida,
          }),
          ...(data.genero !== undefined && {
            genero: data.genero,
          }),
          ...(data.ciudad !== undefined && {
            ciudad: data.ciudad,
          }),
          ...(data.pais !== undefined && {
            pais: data.pais,
          }),
          ...(data.ocupacion !== undefined && {
            ocupacion: data.ocupacion,
          }),
          ...(data.contactoEmergenciaNombre !== undefined && {
            contactoEmergenciaNombre:
              data.contactoEmergenciaNombre,
          }),
          ...(data.contactoEmergenciaTelefono !== undefined && {
            contactoEmergenciaTelefono:
              data.contactoEmergenciaTelefono,
          }),
        },
        create: {
          usuarioId: id,
          nombre: data.nombre ?? "",
          apellidoPaterno: data.apellidoPaterno,
          apellidoMaterno: data.apellidoMaterno,
          tipoDocumentoIdentidad:
            data.tipoDocumentoIdentidad,
          numeroDocumento: data.numeroDocumento,
          telefono: data.telefono,
          fechaNacimiento: fechaNacimientoValida,
          genero: data.genero,
          ciudad: data.ciudad,
          pais: data.pais,
          ocupacion: data.ocupacion,
          contactoEmergenciaNombre:
            data.contactoEmergenciaNombre,
          contactoEmergenciaTelefono:
            data.contactoEmergenciaTelefono,
        },
      });

      if (data.rolId) {
        await tx.usuarioRol.deleteMany({
          where: {
            usuarioId: id,
          },
        });

        await tx.usuarioRol.create({
          data: {
            usuarioId: id,
            rolId: data.rolId,
          },
        });
      }

      return tx.usuario.findUnique({
        where: {
          id,
        },
        include: {
          perfil: true,
          roles: {
            include: {
              rol: true,
            },
          },
        },
      });
    });
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async buscarPorCorreo(correo: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: {
        correo,
      },
      include: {
        perfil: true,
        roles: {
          include: {
            rol: {
              include: {
                permisos: {
                  include: {
                    permiso: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return usuario;
  }

  async buscarPorId(id: string) {
    return await this.prisma.usuario.findUnique({
      where: {
        id,
      },
      include: {
        perfil: true,
        roles: {
          include: {
            rol: {
              include: {
                permisos: {
                  include: {
                    permiso: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async buscarDetallePorId(id: string) {
    return await this.prisma.usuario.findUnique({
      where: {
        id,
      },
      include: {
        perfil: true,
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });
  }

  async actualizarPassword(id: string, newPassword: string) {
    await this.prisma.usuario.update({
      where: {
        id,
      },
      data: {
        contrasenaHash: newPassword,
        estado: "activo",
      }
    }
    );
  }

  async ObtenerTodosPaginado(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          correo: true,
          estado: true,
          correoVerificadoEn: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      this.prisma.usuario.count(),
    ])

    return {
      data: usuarios,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    }
  }

  async buscarUsuarios(q: string) {
    const palabras = q
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (palabras.length === 0) {
      return [];
    }

    const usuarios = await this.prisma.usuario.findMany({
      where: {
        roles: {
          some: {
            rolId: 'rol-est-id',
          },
        },

        AND: palabras.map((palabra) => ({
          OR: [
            {
              username: {
                contains: palabra,
                mode: 'insensitive',
              },
            },
            {
              correo: {
                contains: palabra,
                mode: 'insensitive',
              },
            },
            {
              perfil: {
                nombre: {
                  contains: palabra,
                  mode: 'insensitive',
                },
              },
            },
            {
              perfil: {
                apellidoPaterno: {
                  contains: palabra,
                  mode: 'insensitive',
                },
              },
            },
            {
              perfil: {
                apellidoMaterno: {
                  contains: palabra,
                  mode: 'insensitive',
                },
              },
            },
          ],
        })),
      },

      select: {
        id: true,
      },

      take: 20,
    });

    return usuarios;
  }

  async DesactivarUsuario(id: string) {
    await this.prisma.usuario.update({
      where: {
        id,
      },
      data: {
        estado: "inactivo",
      }
    }
    )
  }

  async ObtenerEstudiantes() {
    const estudiantes = await this.prisma.usuario.findMany({
      where: {
        roles: {
          some: {
            rol: {
              nombre: 'ESTUDIANTE',
            },
          },
        },
      },
    });

    return estudiantes;
  }

  async obtenerMiPerfil(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        username: true,
        correo: true,
        estado: true,
        correoVerificadoEn: true,
        ultimoAccesoEn: true,
        createdAt: true,
        perfil: true,
        roles: {
          select: {
            rol: {
              select: { id: true, nombre: true },
            },
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async actualizarMiPerfil(usuarioId: string, data: UpdateMiPerfilDto) {
    if (data.correo) {
      const correoEnUso = await this.prisma.usuario.findFirst({
        where: { correo: data.correo, NOT: { id: usuarioId } },
        select: { id: true },
      });

      if (correoEnUso) {
        throw new ConflictException('Ese correo ya está en uso por otra cuenta');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (data.correo !== undefined) {
        await tx.usuario.update({
          where: { id: usuarioId },
          data: { correo: data.correo },
        });
      }

      const fechaNacimiento = data.fechaNacimiento
        ? new Date(data.fechaNacimiento)
        : undefined;

      const fechaNacimientoValida =
        fechaNacimiento && !Number.isNaN(fechaNacimiento.getTime())
          ? fechaNacimiento
          : undefined;

      await tx.perfil.upsert({
        where: { usuarioId },
        update: {
          ...(data.nombre !== undefined && { nombre: data.nombre }),
          ...(data.apellidoPaterno !== undefined && {
            apellidoPaterno: data.apellidoPaterno,
          }),
          ...(data.apellidoMaterno !== undefined && {
            apellidoMaterno: data.apellidoMaterno,
          }),
          ...(data.tipoDocumentoIdentidad !== undefined && {
            tipoDocumentoIdentidad: data.tipoDocumentoIdentidad,
          }),
          ...(data.numeroDocumento !== undefined && {
            numeroDocumento: data.numeroDocumento,
          }),
          ...(data.telefono !== undefined && {
            telefono: data.telefono,
          }),
          ...(fechaNacimientoValida !== undefined && {
            fechaNacimiento: fechaNacimientoValida,
          }),
          ...(data.genero !== undefined && {
            genero: data.genero,
          }),
          ...(data.ciudad !== undefined && {
            ciudad: data.ciudad,
          }),
          ...(data.pais !== undefined && {
            pais: data.pais,
          }),
          ...(data.paisCodigo !== undefined && {
            paisCodigo: data.paisCodigo.trim().toUpperCase(),
          }),
          ...(data.ocupacion !== undefined && {
            ocupacion: data.ocupacion,
          }),
          ...(data.contactoEmergenciaNombre !== undefined && {
            contactoEmergenciaNombre: data.contactoEmergenciaNombre,
          }),
          ...(data.contactoEmergenciaTelefono !== undefined && {
            contactoEmergenciaTelefono: data.contactoEmergenciaTelefono,
          }),
        },
        create: {
          usuarioId,
          nombre: data.nombre ?? "",
          apellidoPaterno: data.apellidoPaterno,
          apellidoMaterno: data.apellidoMaterno,
          tipoDocumentoIdentidad: data.tipoDocumentoIdentidad,
          numeroDocumento: data.numeroDocumento,
          telefono: data.telefono,
          fechaNacimiento: fechaNacimientoValida,
          genero: data.genero,
          ciudad: data.ciudad,
          pais: data.pais,
          paisCodigo: data.paisCodigo?.trim().toUpperCase(),
          ocupacion: data.ocupacion,
          contactoEmergenciaNombre: data.contactoEmergenciaNombre,
          contactoEmergenciaTelefono: data.contactoEmergenciaTelefono,
        },
      });

      return tx.usuario.findUnique({
        where: { id: usuarioId },
        select: {
          id: true,
          username: true,
          correo: true,
          estado: true,
          perfil: true,
        },
      });
    });
  }

  async cambiarMiPassword(
    usuarioId: string,
    dto: CambiarMiPasswordDto,
  ) {
    const usuario =
      await this.prisma.usuario.findUnique({
        where: {
          id: usuarioId,
        },
        select: {
          id: true,
          contrasenaHash: true,
        },
      });

    if (!usuario) {
      throw new NotFoundException(
        "Usuario no encontrado",
      );
    }

    if (!usuario.contrasenaHash) {
      throw new BadRequestException(
        "Tu cuenta utiliza inicio de sesión con Google y todavía no tiene una contraseña local.",
      );
    }

    const coincide =
      await bcrypt.compare(
        dto.passwordActual,
        usuario.contrasenaHash,
      );

    if (!coincide) {
      throw new UnauthorizedException(
        "La contraseña actual no es correcta",
      );
    }

    const nuevoHash =
      await this.hashPassword(
        dto.passwordNueva,
      );

    await this.prisma.usuario.update({
      where: {
        id: usuarioId,
      },
      data: {
        contrasenaHash:
          nuevoHash,
      },
    });

    return {
      mensaje:
        "Contraseña actualizada correctamente",
    };
  }

  async changePasswordUser(id: string, dto: ChangePasswordUserDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, username: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const nuevoHash = await this.hashPassword(dto.password);

    await this.prisma.usuario.update({
      where: { id },
      data: { contrasenaHash: nuevoHash },
    });

    return { mensaje: 'Contraseña actualizada correctamente ' + usuario.username };
  }

  async actualizarFotoPerfil(
    usuarioId: string,
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Debe seleccionar una imagen',
      );
    }

    const imagen =
      await this.cloudinaryService.uploadImage(
        file,
        'elite/perfiles',
      );

    const perfil =
      await this.prisma.perfil.upsert({
        where: {
          usuarioId,
        },
        update: {
          fotografiaRuta: imagen.url,
        },
        create: {
          usuarioId,
          nombre: '',
          fotografiaRuta: imagen.url,
        },
      });

    return {
      success: true,
      message:
        'Foto de perfil actualizada correctamente',
      data: perfil,
    };
  }
}


