import { PartialType } from '@nestjs/mapped-types';
import { CreateProgresoDto } from './create-progreso.dto';

export class UpdateProgresoDto extends PartialType(CreateProgresoDto) {}
