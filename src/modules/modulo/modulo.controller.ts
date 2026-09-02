import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { ModuloService } from './modulo.service';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { QueryModuloDto } from './dto/query-modulo.dto';
import { QueryModuloCursoDto } from './dto/query-modulo-curso.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { Permission } from 'src/common/decorator/decorator';

@Controller('modulos')
export class ModuloController {
  constructor(private readonly moduloService: ModuloService) { }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('modulos.crear')
  @UseInterceptors(FileInterceptor('rutaImagen'))
  create(
    @Body() createModuloDto: CreateModuloDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.moduloService.create(createModuloDto, file);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('modulos.ver')
  findAll(@Query() query: QueryModuloDto) {
    return this.moduloService.findAll(query);
  }

  @Get('curso/:cursoId')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('modulos.ver')
  findByCurso(
    @Param('cursoId') cursoId: string,
    @Query() query: QueryModuloCursoDto,
  ) {
    return this.moduloService.findByCurso(cursoId, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('modulos.ver')
  findOne(@Param('id') id: string) {
    return this.moduloService.findOne(id);
  }

  @Get(':id/lecciones')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('modulos.ver')
  findLecciones(@Param('id') id: string) {
    return this.moduloService.findLecciones(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('modulos.editar')
  @UseInterceptors(FileInterceptor('rutaImagen'))
  update(
    @Param('id') id: string,
    @Body() updateModuloDto: UpdateModuloDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.moduloService.update(id, updateModuloDto, file);
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
