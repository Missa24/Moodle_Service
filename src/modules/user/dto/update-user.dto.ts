import {
    IsDateString,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
} from "class-validator";

export class UpdateUsuarioDto {
    @IsEmail()
    @IsNotEmpty()
    correo!: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    username?: string;

    @IsOptional()
    @IsString()
    estado?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    nombre?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    apellidoPaterno?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    apellidoMaterno?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    tipoDocumentoIdentidad?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    numeroDocumento?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    fechaNacimiento?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    genero?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    telefono?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    ciudad?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    pais?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    ocupacion?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    contactoEmergenciaNombre?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    contactoEmergenciaTelefono?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    rolId?: string;
}



export class UpdateMiPerfilDto {
    @IsOptional()
    @IsEmail()
    correo?: string;

    @IsOptional()
    @IsString()
    nombre?: string;

    @IsOptional()
    @IsString()
    apellidoPaterno?: string;

    @IsOptional()
    @IsString()
    apellidoMaterno?: string;

    @IsOptional()
    @IsString()
    tipoDocumentoIdentidad?: string;

    @IsOptional()
    @IsString()
    numeroDocumento?: string;

    @IsOptional()
    @IsDateString()
    fechaNacimiento?: string;

    @IsOptional()
    @IsString()
    genero?: string;

    @IsOptional()
    @IsString()
    telefono?: string;

    @IsOptional()
    @IsString()
    ciudad?: string;

    @IsOptional()
    @IsString()
    pais?: string;

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
