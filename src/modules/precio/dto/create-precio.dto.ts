import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePrecioDto {
  @IsString()
  @IsNotEmpty()
  moduloId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costo!: number;
}
