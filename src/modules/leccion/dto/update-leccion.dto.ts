import { PartialType } from "@nestjs/mapped-types";
import { CreateLeccionDto } from "./create-leccion.dto";

export class UpdateLeccionDto extends PartialType(CreateLeccionDto) { }