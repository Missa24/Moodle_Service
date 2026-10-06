import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { LeadService } from './lead.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { Permission } from 'src/common/decorator/decorator';
import type { AuthenticatedRequest } from 'src/common/types/authenticated-user';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateEstadoLeadDto } from './dto/update-estado-lead.dto';

@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateLeadDto, @Request() req: AuthenticatedRequest) {
    return this.leadService.create(req.user.id, dto);
  }

  @Get('curso/:cursoId/estado-compra')
  @UseGuards(JwtAuthGuard)
  obtenerEstadoCompraCurso(
    @Param('cursoId') cursoId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.leadService.obtenerEstadoCompraCurso(req.user.id, cursoId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('leads.ver')
  findAll(
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

  @Get('usuario/:usuarioId')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('leads.ver')
  findByUser(@Param('usuarioId') usuarioId: string) {
    return this.leadService.findByUser(usuarioId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('leads.ver')
  findById(@Param('id') id: string) {
    return this.leadService.findById(id);
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('leads.ver')
  @UseInterceptors(
    FileInterceptor('comprobante', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  updateEstado(
    @Param('id') id: string,
    @Body() dto: UpdateEstadoLeadDto,
    @UploadedFile() comprobante?: Express.Multer.File,
  ) {
    const {
      estado,
      medioPago,
      moneda,
      montoCobrado,
      referenciaPago,
      observaciones,
    } = dto;

    return this.leadService.updateEstado(
      id,
      estado,
      {
        medioPago,
        moneda,
        montoCobrado,
        referenciaPago,
        observaciones,
      },
      comprobante,
    );
  }
}