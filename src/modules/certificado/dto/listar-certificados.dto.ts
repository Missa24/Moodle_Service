import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListarCertificadosDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    buscar?: string;
}

// Esto permitirá recibir: 
// ?page=1 
// ?limit=10
//?buscar=curso

//?page=2&limit=5&buscar=programacion