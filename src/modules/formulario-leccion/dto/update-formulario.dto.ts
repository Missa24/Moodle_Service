import { IsString, IsOptional } from "class-validator";

export class UpdateFormularioDto {
    @IsOptional()
    @IsString()
    titulo?: string;

    @IsOptional()
    @IsString()
    estado?: string;
}