import { IsString } from "class-validator";

export class CreateUserDto {
    @IsString()
    nombre!: string;

    @IsString()
    apellidoPaterno!: string;

    @IsString()
    apellidoMaterno?: string;

    @IsString()
    correo!: string;

    @IsString()
    numeroDocumento!: string;

    @IsString()
    rolId!: string;
}