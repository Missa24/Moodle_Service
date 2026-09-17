import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { VentasService } from './ventas.service';
import { QueryVentasDto } from './dto/query-ventas.dto';
import { UpdateComisionDto } from './dto/update-venta.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permission.guard';
import { Permission } from 'src/common/decorator/decorator';

@Controller('ventas')
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
export class VentasController {
  constructor(
    private readonly ventasService: VentasService,
  ) { }

  @Get()
  @Permission('ventas.ver')
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
  @Permission('ventas.ver')
  findOne(
    @Param('id') id: string,
  ) {
    return this.ventasService.findOne(
      id,
    );
  }

  @Patch(':id/comision')
  @Permission('ventas.editar')
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
  @Permission('ventas.editar')
  marcarComisionPendiente(
    @Param('id') id: string,
  ) {
    return this.ventasService.marcarComisionPendiente(
      id,
    );
  }
}