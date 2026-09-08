import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';

import { LeadService } from './lead.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/common/types/authenticated-user';
import { Permission } from 'src/auth/enums/permission.enum';
import { Permissions } from 'src/auth/decorators/permission.decorator';
import { PermissionsGuard } from 'src/auth/guards/permission.guard';

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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.LEAD_VER)
  async findAll() {
    return this.leadService.findAll();
  }
}