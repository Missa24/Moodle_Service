import { Module } from '@nestjs/common';
import { FormularioLeccionService } from './formulario-leccion.service';
import { FormularioLeccionController } from './formulario-leccion.controller';

@Module({
  controllers: [FormularioLeccionController],
  providers: [FormularioLeccionService],
})
export class FormularioLeccionModule {}
