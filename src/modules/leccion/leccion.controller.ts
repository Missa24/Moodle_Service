import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import type { Response } from 'express';

import { FileInterceptor } from '@nestjs/platform-express';

import { LeccionService } from './leccion.service';

import { CreateLeccionDto } from './dto/create-leccion.dto';
import { UpdateLeccionDto } from './dto/update-leccion.dto';
import { QueryLeccionDto } from './dto/query-leccion.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import type { AuthenticatedRequest } from 'src/common/types/authenticated-user';

import { MarcarCompletadaDto } from './dto/responder-formulario.dto';

import { PermissionGuard } from 'src/common/guards/permission.guard';
import { Permission } from 'src/common/decorator/decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('lecciones')
export class LeccionController {
  constructor(
    private readonly leccionService: LeccionService,
  ) { }


  @Post()
  @UseGuards(
    JwtAuthGuard,
    PermissionGuard,
  )
  @Permission('lecciones.crear')
  @UseInterceptors(
    FileInterceptor('video'),
  )
  create(
    @Body()
    dto: CreateLeccionDto,

    @UploadedFile()
    video?: Express.Multer.File,
  ) {
    return this.leccionService.create(
      dto,
      video,
    );
  }

  @Public()
  @Get('modulo/:moduloId')
  findByModulo(
    @Param('moduloId')
    moduloId: string,

    @Query()
    query: QueryLeccionDto,
  ) {
    return this.leccionService.findByModulo(
      moduloId,
      query,
    );
  }

  @Get('modulo/:moduloId/progreso')
  @UseGuards(JwtAuthGuard)
  findByModuloConProgreso(
    @Param('moduloId')
    moduloId: string,

    @Request()
    req: AuthenticatedRequest,
  ) {
    return this.leccionService.findByModuloConProgreso(
      moduloId,
      req.user.id,
    );
  }

  @Get(':id/video')
  @UseGuards(JwtAuthGuard)
  async video(
    @Param('id')
    id: string,

    @Request()
    req: AuthenticatedRequest,

    @Headers('range')
    range: string | undefined,

    @Res()
    res: Response,
  ) {
    const esAdmin =
      req.user.permisos.includes(
        'lecciones.editar',
      );

    const {
      stream,
      metadata,
    } =
      await this.leccionService.obtenerVideoLeccion(
        id,
        req.user.id,
        esAdmin,
        range,
      );

    const mimeType =
      metadata.mimeType ??
      'video/mp4';

    const size = Number(
      metadata.size ?? 0,
    );

    res.setHeader(
      'Content-Type',
      mimeType,
    );

    res.setHeader(
      'Accept-Ranges',
      'bytes',
    );
    if (range && size > 0) {
      const match =
        range.match(
          /bytes=(\d+)-(\d*)/,
        );

      if (match) {
        const start =
          Number(match[1]);

        const end =
          match[2]
            ? Number(match[2])
            : size - 1;

        res.status(206);

        res.setHeader(
          'Content-Range',
          `bytes ${start}-${end}/${size}`,
        );

        res.setHeader(
          'Content-Length',
          end - start + 1,
        );
      }
    } else if (size > 0) {
      res.setHeader(
        'Content-Length',
        size,
      );
    }

    stream.on(
      'error',
      (error) => {
        if (!res.headersSent) {
          res.status(500);
        }

        res.end();

        console.error(
          'Error transmitiendo video:',
          error,
        );
      },
    );

    stream.pipe(res);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id')
    id: string,

    @Request()
    req: AuthenticatedRequest,
  ) {
    const esAdmin =
      req.user.permisos.includes(
        'lecciones.editar',
      );

    return this.leccionService.findOne(
      id,
      req.user.id,
      esAdmin,
    );
  }

  @Get(':id/video')
  @UseGuards(JwtAuthGuard)
  async reproducirVideo(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const esAdmin =
      req.user.permisos.includes('lecciones.editar');

    const {
      stream,
      metadata,
    } = await this.leccionService.obtenerVideoLeccion(
      id,
      req.user.id,
      esAdmin,
    );

    res.setHeader(
      'Content-Type',
      metadata.mimeType ?? 'video/mp4',
    );

    res.setHeader(
      'Accept-Ranges',
      'bytes',
    );

    stream.pipe(res);
  }

  @Patch(':id')
  @UseGuards(
    JwtAuthGuard,
    PermissionGuard,
  )
  @Permission('lecciones.editar')
  @UseInterceptors(
    FileInterceptor('video'),
  )
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateLeccionDto,

    @UploadedFile()
    video?: Express.Multer.File,
  ) {
    return this.leccionService.update(
      id,
      dto,
      video,
    );
  }

  @Patch(':id/restaurar')
  @UseGuards(
    JwtAuthGuard,
    PermissionGuard,
  )
  @Permission('lecciones.editar')
  restore(
    @Param('id')
    id: string,
  ) {
    return this.leccionService.restore(
      id,
    );
  }

  @Delete(':id')
  @UseGuards(
    JwtAuthGuard,
    PermissionGuard,
  )
  @Permission('lecciones.eliminar')
  remove(
    @Param('id')
    id: string,
  ) {
    return this.leccionService.remove(
      id,
    );
  }


  @Post(':id/completar')
  @UseGuards(JwtAuthGuard)
  marcarCompletada(
    @Param('id')
    id: string,

    @Body()
    dto: MarcarCompletadaDto,

    @Request()
    req: AuthenticatedRequest,
  ) {
    return this.leccionService.marcarCompletada(
      id,
      req.user.id,
      dto.respuestas,
    );
  }

  @Get(':id/formulario')
  @UseGuards(JwtAuthGuard)
  findFormularioPublico(
    @Param('id')
    id: string,
  ) {
    return this.leccionService.findFormularioPublico(
      id,
    );
  }
}