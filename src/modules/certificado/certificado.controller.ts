import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  Res,
  StreamableFile,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ListarCertificadosDto } from './dto/listar-certificados.dto';
import { AnularCertificadoDto } from './dto/anular-certificado.dto';
import { CertificadoService } from './certificado.service';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/common/types/authenticated-user';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('certificados')
export class CertificadosController {
  constructor(private readonly certificadoService: CertificadoService) { }

  // ---- Rutas fijas / con prefijo (van SIEMPRE antes que ':id') ----

  @Get()
  findAll(@Query() query: ListarCertificadosDto) {
    return this.certificadoService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mis-certificados')
  async misCertificados(
    @Request() req: AuthenticatedRequest,
    @Query('buscar') buscar?: string,
  ) {
    return this.certificadoService.obtenerCertificadosPorUsuario(req.user.id, buscar);
  }

  @Get('usuario/:usuarioId')
  async buscarPorUsuario(@Param('usuarioId') usuarioId: string) {
    return this.certificadoService.buscarPorUsuario(usuarioId);
  }

  @Public()
  @Get('verificar/:codigo')
  async buscarPorCodigo(@Param('codigo') codigo: string) {
    return this.certificadoService.verificarPorCodigo(codigo);
  }

  @Get('curso/:cursoId')
  async buscarPorCurso(@Param('cursoId') cursoId: string) {
    return this.certificadoService.buscarPorCurso(cursoId);
  }

  @Get('inscripcion/:inscripcionId')
  async buscarPorInscripcion(@Param('inscripcionId') inscripcionId: string) {
    return this.certificadoService.buscarPorInscripcion(inscripcionId);
  }

  @Patch(':id/anular')
  async anularCertificado(
    @Param('id') id: string,
    @Body() dto: AnularCertificadoDto,
  ) {
    return this.certificadoService.anularCertificado(id, dto.motivoAnulacion);
  }

  @Get(':id/estado')
  async consultarEstado(@Param('id') id: string) {
    return this.certificadoService.consultarEstado(id);
  }

  @Get(':id/descargar')
  async descargarCertificado(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, filename } = await this.certificadoService.descargarCertificado(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    return new StreamableFile(buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.certificadoService.findOne(id);
  }
}