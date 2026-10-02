import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';

import type { Response } from 'express';

import { CertificadoService } from './certificado.service';
import { ListarCertificadosDto } from './dto/listar-certificados.dto';
import { AnularCertificadoDto } from './dto/anular-certificado.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Public } from 'src/auth/decorators/public.decorator';

import type { AuthenticatedRequest } from 'src/common/types/authenticated-user';

import { Permission } from 'src/common/decorator/decorator';
import { PermissionGuard } from 'src/common/guards/permission.guard';

@Controller('certificados')
export class CertificadosController {
  constructor(
    private readonly certificadoService: CertificadoService,
  ) { }

  @Get('mis-certificados')
  @UseGuards(JwtAuthGuard)
  misCertificados(
    @Request() req: AuthenticatedRequest,
    @Query('buscar') buscar?: string,
  ) {
    return this.certificadoService.obtenerCertificadosPorUsuario(
      req.user.id,
      buscar,
    );
  }

  @Get()
  @UseGuards(
    JwtAuthGuard,
    PermissionGuard,
  )
  @Permission('certificados.ver')
  findAll(
    @Query() query: ListarCertificadosDto,
  ) {
    return this.certificadoService.findAll(
      query,
    );
  }

  @Get('usuario/:usuarioId')
  @UseGuards(
    JwtAuthGuard,
    PermissionGuard,
  )
  @Permission('certificados.ver')
  buscarPorUsuario(
    @Param('usuarioId')
    usuarioId: string,
  ) {
    return this.certificadoService.buscarPorUsuario(
      usuarioId,
    );
  }

  @Get('curso/:cursoId')
  @UseGuards(
    JwtAuthGuard,
    PermissionGuard,
  )
  @Permission('certificados.ver')
  buscarPorCurso(
    @Param('cursoId')
    cursoId: string,
  ) {
    return this.certificadoService.buscarPorCurso(
      cursoId,
    );
  }

  @Get('inscripcion/:inscripcionId')
  @UseGuards(
    JwtAuthGuard,
    PermissionGuard,
  )
  @Permission('certificados.ver')
  buscarPorInscripcion(
    @Param('inscripcionId')
    inscripcionId: string,
  ) {
    return this.certificadoService.buscarPorInscripcion(
      inscripcionId,
    );
  }

  @Post('modulo/:inscripcionId/emitir')
  @UseGuards(JwtAuthGuard)
  emitirCertificadoModulo(
    @Request()
    req: AuthenticatedRequest,

    @Param('inscripcionId')
    inscripcionId: string,

    @Body()
    body: {
      nombreCertificado: string;
    },
  ) {
    return this.certificadoService.emitirCertificadoModulo(
      inscripcionId,
      req.user.id,
      body.nombreCertificado,
    );
  }

  @Post('curso/:cursoId/emitir')
  @UseGuards(JwtAuthGuard)
  emitirCertificadoCurso(
    @Request()
    req: AuthenticatedRequest,

    @Param('cursoId')
    cursoId: string,

    @Body()
    body: {
      nombreCertificado: string;
    },
  ) {
    return this.certificadoService.verificarYEmitirCertificadoCurso(
      req.user.id,
      cursoId,
      body.nombreCertificado,
    );
  }

  @Get(':id/descargar')
  @UseGuards(JwtAuthGuard)
  async descargarCertificado(
    @Param('id')
    id: string,

    @Res({
      passthrough: true,
    })
    res: Response,
  ): Promise<StreamableFile> {
    const {
      buffer,
      filename,
    } =
      await this.certificadoService.descargarCertificado(
        id,
      );

    res.set({
      'Content-Type':
        'application/pdf',

      'Content-Disposition':
        `attachment; filename="${filename}"`,

      'Content-Length':
        buffer.length,
    });

    return new StreamableFile(
      buffer,
    );
  }

  @Get(':id/estado')
  @UseGuards(
    JwtAuthGuard,
    PermissionGuard,
  )
  @Permission('certificados.ver')
  consultarEstado(
    @Param('id')
    id: string,
  ) {
    return this.certificadoService.consultarEstado(
      id,
    );
  }

  @Patch(':id/nombre')
  @UseGuards(
    JwtAuthGuard,
    PermissionGuard,
  )
  @Permission('certificados.editar')
  actualizarNombreCertificado(
    @Param('id')
    id: string,

    @Body()
    body: {
      nombreCertificado: string;
    },
  ) {
    return this.certificadoService.actualizarNombreCertificado(
      id,
      body.nombreCertificado,
    );
  }

  @Patch(':id/anular')
  @UseGuards(
    JwtAuthGuard,
    PermissionGuard,
  )
  @Permission(
    'certificados.eliminar',
  )
  anularCertificado(
    @Param('id')
    id: string,

    @Body()
    dto: AnularCertificadoDto,
  ) {
    return this.certificadoService.anularCertificado(
      id,
      dto.motivoAnulacion,
    );
  }

  @Public()
  @Get('verificar/:codigo')
  buscarPorCodigo(
    @Param('codigo')
    codigo: string,
  ) {
    return this.certificadoService.verificarPorCodigo(
      codigo,
    );
  }

  @Get(':id')
  @UseGuards(
    JwtAuthGuard,
    PermissionGuard,
  )
  @Permission('certificados.ver')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.certificadoService.findOne(
      id,
    );
  }
}