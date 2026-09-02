import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min } from "class-validator";

export class CreateLeccionDto {
  @IsString()
  @IsNotEmpty()
  moduloId!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  contenidoHtml?: string;

  @IsString()
  @IsNotEmpty()
  tipoLeccion!: string;

  @IsOptional()
  @IsString()
  urlVideo?: string;

  @IsOptional()
  @IsString()
  proveedorVideo?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @IsOptional()
  @IsBoolean()
  esVistaPrevia?: boolean;

  @IsOptional()
  @IsBoolean()
  requiereLeccionAnteriorCompletada?: boolean;

  @IsOptional()
  @IsBoolean()
  estaPublicada?: boolean;
}