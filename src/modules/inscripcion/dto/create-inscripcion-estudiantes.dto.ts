import { IsNotEmpty, IsString } from "class-validator";

export class CreateInscripcionEstudiantesDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  moduloIds!: string[];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  estudianteIds!: string[];
}