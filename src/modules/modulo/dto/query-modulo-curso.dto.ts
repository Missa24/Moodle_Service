import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const toBoolean = ({ value }: { value: string }) =>
    value === 'true' ? true : value === 'false' ? false : value;

export class QueryModuloCursoDto {
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
    nombre?: string;

    @IsOptional()
    @Transform(toBoolean)
    @IsBoolean()
    estaPublicado?: boolean;
}