import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsInt, Min } from "class-validator";

export class CreateOpcionDto {
    @IsString()
    @IsNotEmpty()
    texto!: string;

    @IsOptional()
    @IsBoolean()
    esCorrecta?: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    orden?: number;
}