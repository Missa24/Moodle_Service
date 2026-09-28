import { Module } from '@nestjs/common';

import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { InscripcionModule } from 'src/modules/inscripcion/inscripcion.module';
import { VentasModule } from 'src/ventas/ventas.module';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Module({
  controllers: [LeadController],
  providers: [LeadService, CloudinaryService],
  imports: [InscripcionModule, VentasModule],
})
export class LeadModule { }