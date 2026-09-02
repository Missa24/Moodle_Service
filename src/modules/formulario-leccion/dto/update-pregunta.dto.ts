import { PartialType, OmitType } from "@nestjs/mapped-types";
import { CreatePreguntaDto } from "./create-pregunta.dto";

export class UpdatePreguntaDto extends PartialType(OmitType(CreatePreguntaDto, ["opciones"] as const)) { }