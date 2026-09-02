import { IsNotEmpty, IsString } from 'class-validator';

export class AnularCertificadoDto {
  @IsString()
  @IsNotEmpty()
  motivoAnulacion!: string;
}