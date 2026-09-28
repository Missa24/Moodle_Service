import {
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    Max,
    Min,
    ValidateIf,
} from 'class-validator';

import {
    Transform,
    Type,
} from 'class-transformer';

import {
    TipoDescuentoCurso,
} from '@prisma/client';

export class ConfigurarVentaCursoDto {
    @IsEnum(TipoDescuentoCurso)
    tipoDescuento!: TipoDescuentoCurso;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0.01)
    @Max(100)
    porcentaje?: number;

    @IsOptional()
    @IsString()
    moduloDescuentoId?: string;

    @IsOptional()
    @ValidateIf(
        (_, value) => value !== '',
    )
    @IsUrl()
    urlPago?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'boolean') {
            return value;
        }

        if (value === 'true') {
            return true;
        }

        if (value === 'false') {
            return false;
        }

        return value;
    })
    @IsBoolean()
    habilitado?: boolean;
}
