import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from "class-validator";

export class CreateRecursoLeccionDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  @IsNotEmpty()
  tipoRecurso!: string;

  @IsOptional()
  @IsString()
  rutaRecurso?: string;

  @IsOptional()
  @IsString()
  urlExterna?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}