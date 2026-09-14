import { Transform, Type } from 'class-transformer';
import {
    IsBoolean,
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { MedioPago } from '@prisma/client';

export class QueryVentasDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    usuarioId?: string;

    @IsOptional()
    @IsString()
    moduloId?: string;

    @IsOptional()
    @IsEnum(MedioPago)
    medioPago?: MedioPago;

    @IsOptional()
    @IsString()
    moneda?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === true || value === 'true') return true;
        if (value === false || value === 'false') return false;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return value;
    })
    @IsBoolean()
    comisionConfirmada?: boolean;

    @IsOptional()
    @IsDateString()
    desde?: string;

    @IsOptional()
    @IsDateString()
    hasta?: string;
}