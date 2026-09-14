import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { DescuentoService } from './descuento.service';
import { CreateDescuentoDto } from './dto/create-descuento.dto';
import { UpdateDescuentoDto } from './dto/update-descuento.dto';

@Controller('descuentos')
export class DescuentoController {
  constructor(
    private readonly descuentoService: DescuentoService,
  ) { }

  @Post()
  create(
    @Body()
    createDescuentoDto: CreateDescuentoDto,
  ) {
    return this.descuentoService.create(
      createDescuentoDto,
    );
  }

  @Get()
  findAll() {
    return this.descuentoService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.descuentoService.findOne(
      id,
    );
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    updateDescuentoDto: UpdateDescuentoDto,
  ) {
    return this.descuentoService.update(
      id,
      updateDescuentoDto,
    );
  }

  @Delete(':id')
  remove(
    @Param('id')
    id: string,
  ) {
    return this.descuentoService.remove(
      id,
    );
  }

  @Patch(':id/restaurar')
  restore(
    @Param('id')
    id: string,
  ) {
    return this.descuentoService.restore(
      id,
    );
  }
}