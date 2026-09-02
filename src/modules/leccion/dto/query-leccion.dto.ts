import { IsOptional, IsString, IsBoolean } from "class-validator";
import { Transform } from "class-transformer";

export class QueryLeccionDto {
    @IsOptional()
    @IsString()
    nombre?: string;

    @IsOptional()
    @IsString()
    tipoLeccion?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === "") return undefined;
        if (typeof value === "boolean") return value;
        return value === "true";
    })
    @IsBoolean()
    estaPublicada?: boolean;
}