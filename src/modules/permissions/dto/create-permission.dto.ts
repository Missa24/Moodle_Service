import { IsString } from "class-validator";

export class CreatePermissionDto {
    @IsString()
    nombre!: string;

    @IsString()
    descripcion!: string;
}
