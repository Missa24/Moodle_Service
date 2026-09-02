import { Module } from '@nestjs/common';
import { ProgresoService } from './progreso.service';
import { ProgresoController } from './progreso.controller';
import { CertificadosModule } from 'src/modules/certificado/certificado.module';
import { NotificacionesModule } from 'src/modules/notificaciones/notificaciones.module';

@Module({
  imports: [CertificadosModule, NotificacionesModule],
  controllers: [ProgresoController],
  providers: [ProgresoService],
  exports: [ProgresoService],
})
export class ProgresoModule { }
