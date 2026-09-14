import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Body,
} from '@nestjs/common';

import { VentasService } from './ventas.service';
import { QueryVentasDto } from './dto/query-ventas.dto';
import { UpdateComisionDto } from './dto/update-venta.dto';

@Controller('ventas')
export class VentasController {
  constructor(
    private readonly ventasService: VentasService,
  ) { }

  @Get()
  findAll(
    @Query() query: QueryVentasDto,
  ) {
    const {
      page = 1,
      limit = 10,
      ...filtros
    } = query;

    return this.ventasService.findAll(
      page,
      limit,
      filtros,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.ventasService.findOne(id);
  }

  @Patch(':id/comision')
  actualizarComision(
    @Param('id') id: string,
    @Body() dto: UpdateComisionDto,
  ) {
    return this.ventasService.actualizarComision(
      id,
      dto.comision,
    );
  }

  @Patch(':id/comision/pendiente')
  marcarComisionPendiente(
    @Param('id') id: string,
  ) {
    return this.ventasService.marcarComisionPendiente(
      id,
    );
  }
}