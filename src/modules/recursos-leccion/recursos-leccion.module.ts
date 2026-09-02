import { Module } from '@nestjs/common';
import { RecursoLeccionService } from './recursos-leccion.service';
import { RecursoLeccionController } from './recursos-leccion.controller';
import { RecursoLeccionItemController } from './recurso-leccion-item.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';


@Module({
  imports: [
    CloudinaryModule,
  ],
  controllers: [
    RecursoLeccionController,
    RecursoLeccionItemController,
  ],
  providers: [
    RecursoLeccionService,
  ],
  exports: [
    RecursoLeccionService,
  ],
})
export class RecursosLeccionModule { }