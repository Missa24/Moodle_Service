import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreatePermissionRolDto } from './dto/crear-permission-rol.dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) { }

  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.createPermission(createPermissionDto);
  }

  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(+id);
  }



  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(+id);
  }

  @Post('asignar-permiso')
  asignarPermisoRol(@Body() asignarPermisoDto: CreatePermissionRolDto) {
    const { rolId, permisoId } = asignarPermisoDto;
    return this.permissionsService.asignarPermisoRol(rolId, permisoId);
  }
}
