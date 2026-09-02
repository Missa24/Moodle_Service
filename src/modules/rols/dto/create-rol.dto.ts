import { IsString } from "class-validator";

export class AssignPermissionDto {
    @IsString()
    rolId!: string;

    @IsString()
    permisoId!: string;
}
