import { IsArray, IsString, ValidateNested, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class RespuestaItemDto {
    @IsString()
    preguntaFormularioId!: string;

    @IsString()
    opcionFormularioId!: string;
}

export class MarcarCompletadaDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RespuestaItemDto)
    respuestas?: RespuestaItemDto[];
}