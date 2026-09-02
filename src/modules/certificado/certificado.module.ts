import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { CertificadosController } from './certificado.controller';
import { CertificadoService } from './certificado.service';
import { CertificadoPdfService } from './certificado-pdf.service';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [
    CertificadosController,
  ],
  providers: [
    CertificadoService, CertificadoPdfService
  ],
  exports: [
    CertificadoService,
  ],
})
export class CertificadosModule { }