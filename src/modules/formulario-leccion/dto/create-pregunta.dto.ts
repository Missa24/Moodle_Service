// formulario-leccion/dto/create-pregunta.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsArray, ValidateNested, ArrayMinSize } from "class-validator";
import { Type } from "class-transformer";
import { CreateOpcionDto } from "./create-opcion.dto";

export class CreatePreguntaDto {
    @IsString()
    @IsNotEmpty()
    enunciado!: string;

    @IsOptional()
    @IsString()
    tipoPregunta?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    orden?: number;

    @IsArray()
    @ArrayMinSize(2, { message: "Cada pregunta necesita al menos 2 opciones" })
    @ValidateNested({ each: true })
    @Type(() => CreateOpcionDto)
    opciones!: CreateOpcionDto[];
}