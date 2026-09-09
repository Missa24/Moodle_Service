import {
    IsNotEmpty,
    IsString,
} from "class-validator";

export class CreateLeadDto {
    @IsString()
    @IsNotEmpty()
    moduloId!: string;
}