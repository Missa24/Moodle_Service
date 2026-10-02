import {
    IsEmail,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';

export class CreateUserDto {
    @IsString()
    @MinLength(1)
    nombre!: string;

    @IsOptional()
    @IsString()
    apellidoPaterno?: string;

    @IsOptional()
    @IsString()
    apellidoMaterno?: string;

    @IsEmail()
    correo!: string;

    @IsString()
    @MinLength(1)
    numeroDocumento!: string;

    @IsString()
    @MinLength(1)
    rolId!: string;

    @IsOptional()
    @IsString()
    telefono?: string;

    @IsOptional()
    @IsString()
    tipoDocumentoIdentidad?: string;

    @IsOptional()
    @IsString()
    fechaNacimiento?: string;

    @IsOptional()
    @IsString()
    genero?: string;

    @IsOptional()
    @IsString()
    ciudad?: string;

    @IsOptional()
    @IsString()
    pais?: string;

    @IsOptional()
    @IsString()
    paisCodigo?: string;

    @IsOptional()
    @IsString()
    ocupacion?: string;

    @IsOptional()
    @IsString()
    contactoEmergenciaNombre?: string;

    @IsOptional()
    @IsString()
    contactoEmergenciaTelefono?: string;
}