import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCategoriaDto {
    @IsString()
    @IsNotEmpty()
    nombre!: string;

    @IsString()
    @IsNotEmpty()
    slug!: string;

    @IsString()
    @IsOptional()
    categoriaPadreId?: string;
}