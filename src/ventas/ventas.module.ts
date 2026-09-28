import {
  Module,
} from '@nestjs/common';

import {
  VentasService,
} from './ventas.service';

import {
  VentasCursoService,
} from './ventas-curso.service';

import {
  VentasController,
} from './ventas.controller';

@Module({
  controllers: [
    VentasController,
  ],

  providers: [
    VentasService,
    VentasCursoService,
  ],

  exports: [
    VentasService,
    VentasCursoService,
  ],
})
export class VentasModule { }