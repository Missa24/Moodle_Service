import { IsString } from "class-validator";

export class CreatePermissionRolDto {
  @IsString()
  rolId!: string;

  @IsString()
  permisoId!: string;
}
