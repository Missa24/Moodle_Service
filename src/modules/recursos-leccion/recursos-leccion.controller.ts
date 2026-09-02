import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CreateRecursoLeccionDto } from './dto/create-recursos-leccion.dto';
import { RecursoLeccionService } from './recursos-leccion.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateRecursoLeccionDto } from './dto/update-recursos-leccion.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { Permission } from 'src/common/decorator/decorator';

@Controller('lecciones/:leccionId/recursos')
export class RecursoLeccionController {
  constructor(private readonly recursoService: RecursoLeccionService) { }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('recursos_lecciones.crear')
  @UseInterceptors(FileInterceptor('archivo'))
  create(
    @Param('leccionId') leccionId: string,
    @Body() dto: CreateRecursoLeccionDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.recursoService.create(
      leccionId,
      dto,
      file,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('recursos_lecciones.ver')
  findByLeccion(@Param('leccionId') leccionId: string) {
    return this.recursoService.findByLeccion(leccionId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('recursos_lecciones.editar')
  @UseInterceptors(FileInterceptor('archivo'))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRecursoLeccionDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.recursoService.update(
      id,
      dto,
      file,
    );
  }
}
