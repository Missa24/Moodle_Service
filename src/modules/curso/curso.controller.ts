import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';

import { CursoService } from './curso.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { PermissionsGuard } from 'src/auth/guards/permission.guard';
import { Permission } from 'src/auth/enums/permission.enum';
import { Permissions } from 'src/auth/decorators/permission.decorator';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('curso')
export class CursoController {
  constructor(private readonly cursoService: CursoService) { }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CURSO_CREAR)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'rutaPortada', maxCount: 1 },
      { name: 'rutaImagenSecundaria', maxCount: 1 },
    ]),
  )
  async create(
    @Body() createCursoDto: CreateCursoDto,
    @UploadedFiles()
    files: {
      rutaPortada?: Express.Multer.File[];
      rutaImagenSecundaria?: Express.Multer.File[];
    },
  ) {
    return this.cursoService.create(
      createCursoDto,
      files.rutaPortada?.[0],
      files.rutaImagenSecundaria?.[0],
    );
  }

  @Public()
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('categoriaId') categoriaId?: string,
  ) {
    return this.cursoService.findAll(page, limit, search, categoriaId);
  }

  @Get('curso-modulos')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CURSO_VER)
  obtenerCursos() {
    return this.cursoService.obtenerCursos();
  }

  @Get(':id/modulos')
  findModulos(@Param('id') id: string) {
    return this.cursoService.findModulos(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cursoService.findOne(id);
  }

  @Patch(':id/imagen')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CURSO_EDITAR)
  @UseInterceptors(FileInterceptor('imagen'))
  async subirImagenCurso(
    @Param('id') cursoId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.cursoService.subirImagenCurso(file, cursoId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CURSO_EDITAR)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'rutaPortada', maxCount: 1 },
      { name: 'rutaImagenSecundaria', maxCount: 1 },
    ]),
  )
  update(
    @Param('id') id: string,
    @Body() updateCursoDto: UpdateCursoDto,
    @UploadedFiles()
    files: {
      rutaPortada?: Express.Multer.File[];
      rutaImagenSecundaria?: Express.Multer.File[];
    },
  ) {
    return this.cursoService.update(
      id,
      updateCursoDto,
      files.rutaPortada?.[0],
      files.rutaImagenSecundaria?.[0],
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CURSO_ELIMINAR)
  remove(@Param('id') id: string) {
    return this.cursoService.remove(id);
  }

}