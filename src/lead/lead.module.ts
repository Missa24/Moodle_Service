import { Module } from '@nestjs/common';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { InscripcionModule } from 'src/modules/inscripcion/inscripcion.module';

@Module({
  controllers: [LeadController],
  providers: [LeadService],
  imports: [InscripcionModule],
})
export class LeadModule { }
