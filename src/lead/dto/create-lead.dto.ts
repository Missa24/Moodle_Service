import {
    IsEnum,
    IsOptional,
    IsString,
} from 'class-validator';

import {
    TipoCompra,
} from '@prisma/client';

export class CreateLeadDto {
    @IsOptional()
    @IsEnum(TipoCompra)
    tipoCompra?: TipoCompra;

    @IsOptional()
    @IsString()
    moduloId?: string;

    @IsOptional()
    @IsString()
    cursoId?: string;
}