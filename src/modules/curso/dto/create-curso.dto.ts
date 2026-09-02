import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCursoDto {
  @IsString()
  nombre!: string;

  @IsString()
  categoriaId!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  descripcionCorta?: string;

  @IsOptional()
  @IsString()
  descripcionCompleta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duracionHoras?: number;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  creadoPor?: string;
}