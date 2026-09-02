import { PartialType } from '@nestjs/mapped-types';
import { CreateFormularioLeccionDto } from './create-formulario-leccion.dto';

export class UpdateFormularioLeccionDto extends PartialType(CreateFormularioLeccionDto) {}
