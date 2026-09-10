import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
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

  @IsOptional()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  urlPago?: string | null;
}