import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { DescuentoService } from './descuento.service';
import { CreateDescuentoDto } from './dto/create-descuento.dto';
import { UpdateDescuentoDto } from './dto/update-descuento.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { Permission } from 'src/common/decorator/decorator';

@Controller('descuentos')
export class DescuentoController {
  constructor(
    private readonly descuentoService: DescuentoService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('descuentos.crear')
  create(@Body() createDescuentoDto: CreateDescuentoDto,) {
    return this.descuentoService.create(
      createDescuentoDto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('descuentos.ver')
  findAll() {
    return this.descuentoService.findAll();
  }


  @Public()
  @Get("resumen")
  resumen() {
    return this.descuentoService.resumen();
  }

  @Get(':id')
  findOne(@Param('id') id: string,) {
    return this.descuentoService.findOne(
      id,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('descuentos.editar')
  update(@Param('id') id: string, @Body() updateDescuentoDto: UpdateDescuentoDto,) {
    return this.descuentoService.update(
      id,
      updateDescuentoDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('descuentos.eliminar')
  remove(@Param('id') id: string,) {
    return this.descuentoService.remove(
      id,
    );
  }

  @Patch(':id/restaurar')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('descuentos.eliminar') restore(@Param('id') id: string,) {
    return this.descuentoService.restore(
      id,
    );
  }
}