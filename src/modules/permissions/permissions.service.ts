import { Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsService {

  constructor(private readonly prisma: PrismaService) { }

  create(createPermissionDto: CreatePermissionDto) {
    return this.prisma.permiso.create({
      data: createPermissionDto,
    });
  }

  findAll() {
    return this.prisma.permiso.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} permission`;
  }

  update(id: number, updatePermissionDto: UpdatePermissionDto) {
    return `This action updates a #${id} permission`;
  }

  remove(id: number) {
    return `This action removes a #${id} permission`;
  }

  async createPermission(createPermissionDto: CreatePermissionDto) {
    const { nombre, descripcion } = createPermissionDto;
    const permission = await this.prisma.permiso.create({
      data: {
        nombre,
        descripcion,
      },
    });

    return permission;
  }

  async asignarPermisoRol(rolId: string, permisoId: string) {
    const rol = await this.prisma.rol.findUnique({
      where: { id: rolId },
    });

    if (!rol) {
      throw new Error(`Rol con ID ${rolId} no encontrado`);
    }

    const permiso = await this.prisma.permiso.findUnique({
      where: { id: permisoId },
    });

    if (!permiso) {
      throw new Error(`Permiso con ID ${permisoId} no encontrado`);
    }

    await this.prisma.rolPermiso.create({
      data: {
        rolId,
        permisoId,
      },
    });

    return { message: `Permiso ${permiso.nombre} asignado al rol ${rol.nombre}` };
  }
}
