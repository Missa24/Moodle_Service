import { PartialType } from "@nestjs/mapped-types";
import { CreateRecursoLeccionDto } from "./create-recursos-leccion.dto";

export class UpdateRecursoLeccionDto extends PartialType(CreateRecursoLeccionDto) { }