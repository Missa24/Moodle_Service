import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { LeccionService } from './leccion.service';
import { CreateLeccionDto } from './dto/create-leccion.dto';
import { UpdateLeccionDto } from './dto/update-leccion.dto';
import { QueryLeccionDto } from './dto/query-leccion.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/common/types/authenticated-user';

import { MarcarCompletadaDto } from 'src/modules/leccion/dto/responder-formulario.dto';

import { PermissionGuard } from 'src/common/guards/permission.guard';
import { Permission } from 'src/common/decorator/decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('lecciones')
export class LeccionController {
  constructor(private readonly leccionService: LeccionService) { }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('lecciones.crear')
  create(@Body() dto: CreateLeccionDto) {
    return this.leccionService.create(dto);
  }

  @Public()
  @Get('modulo/:moduloId')
  findByModulo(
    @Param('moduloId') moduloId: string,
    @Query() query: QueryLeccionDto,
  ) {
    return this.leccionService.findByModulo(moduloId, query);
  }

  @Get('modulo/:moduloId/progreso')
  @UseGuards(JwtAuthGuard)
  findByModuloConProgreso(
    @Param('moduloId') moduloId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.leccionService.findByModuloConProgreso(
      moduloId,
      req.user.id,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const esAdmin = req.user.permisos.includes('lecciones.editar');

    return this.leccionService.findOne(
      id,
      req.user.id,
      esAdmin,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('lecciones.editar')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeccionDto,
  ) {
    return this.leccionService.update(id, dto);
  }

  @Patch(':id/restaurar')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('lecciones.editar')
  restore(@Param('id') id: string) {
    return this.leccionService.restore(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('lecciones.eliminar')
  remove(@Param('id') id: string) {
    return this.leccionService.remove(id);
  }

  @Post(':id/completar')
  @UseGuards(JwtAuthGuard)
  marcarCompletada(
    @Param('id') id: string,
    @Body() dto: MarcarCompletadaDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.leccionService.marcarCompletada(
      id,
      req.user.id,
      dto.respuestas,
    );
  }

  @Get(':id/formulario')
  @UseGuards(JwtAuthGuard)
  findFormularioPublico(@Param('id') id: string) {
    return this.leccionService.findFormularioPublico(id);
  }
}
