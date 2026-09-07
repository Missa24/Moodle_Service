import {
    IsEmail,
    IsOptional,
    IsString,
    Length,
    MinLength,
} from "class-validator";

export class RegisterDto {
    @IsEmail()
    correo!: string;

    @IsString()
    @MinLength(8)
    contrasena!: string;

    @IsString()
    nombre!: string;

    @IsOptional()
    @IsString()
    apellidoPaterno?: string;

    @IsOptional()
    @IsString()
    apellidoMaterno?: string;

    @IsString()
    @Length(2, 2)
    paisCodigo!: string;
}