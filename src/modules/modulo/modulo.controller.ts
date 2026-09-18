import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { ModuloService } from './modulo.service';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { QueryModuloDto } from './dto/query-modulo.dto';
import { QueryModuloCursoDto } from './dto/query-modulo-curso.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { Permission } from 'src/common/decorator/decorator';
import { Public } from 'src/auth/decorators/public.decorator';

type ModuloFiles = {
  rutaImagen?: Express.Multer.File[];
  qrPagoBolivia?: Express.Multer.File[];
};

@Controller('modulos')
export class ModuloController {
  constructor(private readonly moduloService: ModuloService) { }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('modulos.crear')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'rutaImagen', maxCount: 1 },
      { name: 'qrPagoBolivia', maxCount: 1 },
    ]),
  )
  create(
    @Body() createModuloDto: CreateModuloDto,
    @UploadedFiles() files: ModuloFiles = {},
  ) {
    return this.moduloService.create(
      createModuloDto,
      files.rutaImagen?.[0],
      files.qrPagoBolivia?.[0],
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('modulos.ver')
  findAll(@Query() query: QueryModuloDto) {
    return this.moduloService.findAll(query);
  }

  @Public()
  @Get('curso/:cursoId')
  findByCurso(
    @Param('cursoId') cursoId: string,
    @Query() query: QueryModuloCursoDto,
  ) {
    return this.moduloService.findByCurso(cursoId, query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moduloService.findOne(id);
  }

  @Public()
  @Get(':id/lecciones')
  findLecciones(@Param('id') id: string) {
    return this.moduloService.findLecciones(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('modulos.editar')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'rutaImagen', maxCount: 1 },
      { name: 'qrPagoBolivia', maxCount: 1 },
    ]),
  )
  update(
    @Param('id') id: string,
    @Body() updateModuloDto: UpdateModuloDto,
    @UploadedFiles() files: ModuloFiles = {},
  ) {
    return this.moduloService.update(
      id,
      updateModuloDto,
      files.rutaImagen?.[0],
      files.qrPagoBolivia?.[0],
    );
  }

  @Patch(':id/restaurar')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('modulos.editar')
  restore(@Param('id') id: string) {
    return this.moduloService.restore(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('modulos.eliminar')
  remove(@Param('id') id: string) {
    return this.moduloService.remove(id);
  }
}