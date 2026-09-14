import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';

import { LeadService } from './lead.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { Permission } from 'src/common/decorator/decorator';
import type { AuthenticatedRequest } from 'src/common/types/authenticated-user';
import { UpdateEstadoLeadDto } from './dto/update-estado-lead.dto';

@Controller('leads')
export class LeadController {
  constructor(
    private readonly leadService: LeadService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body('moduloId') moduloId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const usuarioId = req.user.id;

    return this.leadService.create(
      usuarioId,
      moduloId,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('leads.ver')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    return this.leadService.findAll(
      Number(page) || 1,
      Number(limit) || 10,
      q ?? '',
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('leads.ver')
  async findMyLeads(
    @Request() req: AuthenticatedRequest,
  ) {
    return this.leadService.findByUser(
      req.user.id,
    );
  }


  @Get('usuario/:usuarioId')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('leads.ver')
  async findByUser(
    @Param('usuarioId')
    usuarioId: string,
  ) {
    return this.leadService.findByUser(
      usuarioId,
    );
  }


  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('leads.ver')
  async findById(
    @Param('id') id: string,
  ) {
    return this.leadService.findById(
      id,
    );
  }


  @Patch(':id/estado')
  updateEstado(
    @Param('id') id: string,
    @Body() dto: UpdateEstadoLeadDto,
  ) {
    const {
      estado,
      medioPago,
      moneda,
      referenciaPago,
      observaciones,
    } = dto;

    return this.leadService.updateEstado(
      id,
      estado,
      {
        medioPago,
        moneda,
        referenciaPago,
        observaciones,
      },
    );
  }
}