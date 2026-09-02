import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RolsService } from './rols.service';
import { AssignPermissionDto } from './dto/create-rol.dto';

@Controller('rols')
export class RolsController {
  constructor(private readonly rolsService: RolsService) { }

  @Get()
  findAll() {
    return this.rolsService.findAllRols();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRolDto: any) {
    return this.rolsService.update(+id, updateRolDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolsService.remove(+id);
  }

  @Post()
  asignarPermiso(@Body() assignPermissionDto: AssignPermissionDto) {
    return this.rolsService.asignarPermisoRol(assignPermissionDto);
  }
}
