import {
  Controller,
  Get,
  Param,
  Patch,
} from '@nestjs/common';

import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/types/authenticated-user';
import { NotificacionesService } from './notificaciones.service';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(
    private readonly notificacionesService: NotificacionesService,
  ) { }

  @Get()
  findMisNotificaciones(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificacionesService.findByUsuarioId(user.id);
  }

  @Get('pendientes')
  findPendientes(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificacionesService.findPendientesByUsuarioId(user.id);
  }

  @Get('no-leidas')
  contarNoLeidas(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificacionesService.contarNoLeidas(user.id);
  }

  @Patch(':id/marcar-como-leida')
  marcarComoLeida(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') notificacionId: string,
  ) {
    return this.notificacionesService.marcarComoLeida(
      notificacionId,
      user.id,
    );
  }
}