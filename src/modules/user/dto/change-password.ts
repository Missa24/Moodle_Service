import { IsNotEmpty, IsString } from "class-validator";

export class CambiarMiPasswordDto {
    @IsString()
    @IsNotEmpty()
    passwordActual!: string;

    @IsString()
    passwordNueva!: string;
}

export class ChangePasswordUserDto {
    @IsString()
    @IsNotEmpty()
    password!: string;
}