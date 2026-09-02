// formulario-leccion/dto/create-formulario.dto.ts
import { IsString, IsNotEmpty, IsArray, ValidateNested, ArrayMinSize } from "class-validator";
import { Type } from "class-transformer";
import { CreatePreguntaDto } from "./create-pregunta.dto";

export class CreateFormularioDto {
    @IsString()
    @IsNotEmpty()
    titulo!: string;

    @IsArray()
    @ArrayMinSize(1, { message: "El formulario necesita al menos 1 pregunta" })
    @ValidateNested({ each: true })
    @Type(() => CreatePreguntaDto)
    preguntas!: CreatePreguntaDto[];
}