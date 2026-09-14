

import { TipoDescuento } from '@prisma/client';
import { ArrayUnique, IsArray, IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export class CreateDescuentoDto {
    @IsString()
    nombre!: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsEnum(TipoDescuento)
    tipo!: TipoDescuento;

    @IsNumber()
    @Min(0.01)
    valor!: number;

    @IsDateString()
    iniciaEn!: string;

    @IsDateString()
    finalizaEn!: string;

    @IsOptional()
    @IsBoolean()
    habilitado?: boolean;

    @IsOptional()
    @IsBoolean()
    aplicarATodos?: boolean;

    @ValidateIf(
        (dto: CreateDescuentoDto) =>
            dto.aplicarATodos !== true,
    )
    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsString({ each: true })
    moduloIds?: string[];
}