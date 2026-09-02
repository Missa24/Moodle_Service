import { Module } from '@nestjs/common';
import { InscripcionesController } from './inscripciones.controller';
import { InscripcionesService } from './inscripciones.service';

import { PrismaInscripcionesRepository } from './repositories/prisma-inscripciones.repository';
import { InscripcionesRepository } from './repositories/inscripciones.repository';
import { UserModule } from 'src/modules/user/user.module';
import { ModuloModule } from 'src/modules/modulo/modulo.module';

@Module({
  imports: [ModuloModule, UserModule],
  controllers: [InscripcionesController],
  providers: [InscripcionesService,
    {
      provide: InscripcionesRepository,
      useClass: PrismaInscripcionesRepository,
    }
  ]
})
export class InscripcionModule { }
