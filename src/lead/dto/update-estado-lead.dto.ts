import {
    IsEnum,
    IsOptional,
    IsString,
    Matches,
    ValidateIf,
} from 'class-validator';

import {
    EstadoLead,
    MedioPago,
} from '@prisma/client';

export class UpdateEstadoLeadDto {
    @IsEnum(EstadoLead)
    estado!: EstadoLead;

    @ValidateIf(
        (dto: UpdateEstadoLeadDto) =>
            dto.estado === EstadoLead.PAGO_COMPLETADO,
    )
    @IsEnum(MedioPago)
    medioPago?: MedioPago;

    @IsOptional()
    @IsString()
    @Matches(/^[A-Za-z]{3}$/, {
        message: 'La moneda debe tener un código de 3 caracteres',
    })
    moneda?: string;

    @IsOptional()
    @IsString()
    referenciaPago?: string;

    @IsOptional()
    @IsString()
    observaciones?: string;
}