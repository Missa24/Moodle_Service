import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateLeccionDto {
  @IsString()
  moduloId!: string;

  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  contenidoHtml?: string;

  @IsString()
  tipoLeccion!: string;

  @IsOptional()
  @IsString()
  urlVideo?: string;

  @IsOptional()
  @IsString()
  proveedorVideo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orden?: number;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  esVistaPrevia?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  requiereLeccionAnteriorCompletada?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  estaPublicada?: boolean;
}
