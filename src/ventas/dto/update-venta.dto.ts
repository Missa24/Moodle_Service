import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class UpdateComisionDto {
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    comision!: number;
}