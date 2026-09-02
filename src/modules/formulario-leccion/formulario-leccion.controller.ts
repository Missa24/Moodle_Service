import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { FormularioLeccionService } from './formulario-leccion.service';
import { CreateFormularioDto } from './dto/create-formulario.dto';
import { UpdateFormularioDto } from './dto/update-formulario.dto';
import { CreatePreguntaDto } from './dto/create-pregunta.dto';
import { UpdatePreguntaDto } from './dto/update-pregunta.dto';
import { CreateOpcionDto } from './dto/create-opcion.dto';
import { UpdateOpcionDto } from './dto/update-opcion.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { Permission } from 'src/common/decorator/decorator';

@Controller()
export class FormularioLeccionController {
  constructor(private readonly service: FormularioLeccionService) { }

  @Post('lecciones/:leccionId/formulario')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('formularios.crear')
  create(
    @Param('leccionId') leccionId: string,
    @Body() dto: CreateFormularioDto,
  ) {
    return this.service.create(leccionId, dto);
  }

  @Get('lecciones/:leccionId/formulario/admin')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('formularios.ver')
  findByLeccionAdmin(@Param('leccionId') leccionId: string) {
    return this.service.findByLeccionAdmin(leccionId);
  }

  @Patch('formularios-leccion/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('formularios.editar')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFormularioDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete('formularios-leccion/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('formularios.eliminar')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('formularios-leccion/:id/preguntas')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('formularios.editar')
  addPregunta(
    @Param('id') id: string,
    @Body() dto: CreatePreguntaDto,
  ) {
    return this.service.addPregunta(id, dto);
  }

  @Patch('preguntas-formulario/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('formularios.editar')
  updatePregunta(
    @Param('id') id: string,
    @Body() dto: UpdatePreguntaDto,
  ) {
    return this.service.updatePregunta(id, dto);
  }

  @Delete('preguntas-formulario/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('formularios.editar')
  removePregunta(@Param('id') id: string) {
    return this.service.removePregunta(id);
  }

  @Post('preguntas-formulario/:id/opciones')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('formularios.editar')
  addOpcion(
    @Param('id') id: string,
    @Body() dto: CreateOpcionDto,
  ) {
    return this.service.addOpcion(id, dto);
  }

  @Patch('opciones-formulario/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('formularios.editar')
  updateOpcion(
    @Param('id') id: string,
    @Body() dto: UpdateOpcionDto,
  ) {
    return this.service.updateOpcion(id, dto);
  }

  @Delete('opciones-formulario/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('formularios.editar')
  removeOpcion(@Param('id') id: string) {
    return this.service.removeOpcion(id);
  }
}
