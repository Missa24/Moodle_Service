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
import { CategoriaService } from './categoria.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permission.guard';
import { Permission } from 'src/auth/enums/permission.enum';
import { Permissions } from 'src/auth/decorators/permission.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('categoria')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) { }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CATEGORIA_CREAR)
  create(@Body() dto: CreateCategoriaDto) {
    return this.categoriaService.create(dto);
  }

  @Public()
  @Get()
  findAll() {
    return this.categoriaService.findAll();
  }

  @Get(':id/subcategorias')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  findSubCategorias(@Param('id') id: string) {
    return this.categoriaService.findSubCategorias(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  findOne(@Param('id') id: string) {
    return this.categoriaService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CATEGORIA_EDITAR)
  update(@Param('id') id: string, @Body() dto: UpdateCategoriaDto) {
    return this.categoriaService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CATEGORIA_ELIMINAR)
  remove(@Param('id') id: string) {
    return this.categoriaService.remove(id);
  }
}
