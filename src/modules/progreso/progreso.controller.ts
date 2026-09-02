import { Controller, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ProgresoService } from './progreso.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/common/types/authenticated-user';

@Controller('progreso')
export class ProgresoController {
  constructor(private readonly progresoService: ProgresoService) { }

  @UseGuards(JwtAuthGuard)
  @Get("me/:moduloId")
  async obtenerMiProgreso(
    @Param("moduloId") moduloId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const estudianteId = req.user.id;

    return this.progresoService.obtenerPorModuloYUsuario(moduloId, estudianteId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async obtenerMisProgresos(
    @Request() req: AuthenticatedRequest,
  ) {
    const estudianteId = req.user.id;

    return this.progresoService.obtenerPorUsuario(estudianteId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("usuario/:estudianteId/modulo/:moduloId")
  async obtenerProgresoUsuario(
    @Param("estudianteId") estudianteId: string,
    @Param("moduloId") moduloId: string,
  ) {
    return this.progresoService.obtenerPorModuloYUsuario(
      moduloId,
      estudianteId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("inscripcion/:inscripcionId")
  async obtenerPorInscripcion(
    @Param("inscripcionId") inscripcionId: string,
  ) {
    return this.progresoService.obtenerPorInscripcion(
      inscripcionId,
    );
  }

}
