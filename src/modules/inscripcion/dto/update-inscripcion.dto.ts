import { IsOptional, IsNumber, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class UpdateInscripcionDto {
  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  estadoAcceso?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  porcentajeAvance?: number;

  @IsOptional()
  @IsString()
  fechaFinalizacion?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto?: number;
}