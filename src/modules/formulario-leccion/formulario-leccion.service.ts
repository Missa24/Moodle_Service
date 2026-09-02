import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateFormularioDto } from "./dto/create-formulario.dto";
import { UpdateFormularioDto } from "./dto/update-formulario.dto";
import { CreatePreguntaDto } from "./dto/create-pregunta.dto";
import { UpdatePreguntaDto } from "./dto/update-pregunta.dto";
import { CreateOpcionDto } from "./dto/create-opcion.dto";
import { UpdateOpcionDto } from "./dto/update-opcion.dto";

@Injectable()
export class FormularioLeccionService {
  constructor(private readonly prisma: PrismaService) { }

  async create(leccionId: string, dto: CreateFormularioDto) {
    const leccion = await this.prisma.leccion.findUnique({
      where: { id: leccionId },
      include: { formulario: true },
    });

    if (!leccion) {
      throw new NotFoundException("Lección no encontrada");
    }
    if (leccion.formulario) {
      throw new ConflictException("Esta lección ya tiene un formulario. Edítalo en vez de crear otro.");
    }

    for (const pregunta of dto.preguntas) {
      const correctas = pregunta.opciones.filter((o) => o.esCorrecta).length;
      if (correctas !== 1) {
        throw new BadRequestException(
          `La pregunta "${pregunta.enunciado}" debe tener exactamente una opción correcta`,
        );
      }
    }

    return this.prisma.formularioLeccion.create({
      data: {
        leccionId,
        titulo: dto.titulo,
        preguntas: {
          create: dto.preguntas.map((p, index) => ({
            enunciado: p.enunciado,
            tipoPregunta: p.tipoPregunta ?? "opcion_unica",
            orden: p.orden ?? index,
            opciones: {
              create: p.opciones.map((o, oIndex) => ({
                texto: o.texto,
                esCorrecta: o.esCorrecta ?? false,
                orden: o.orden ?? oIndex,
              })),
            },
          })),
        },
      },
      include: { preguntas: { include: { opciones: true }, orderBy: { orden: "asc" } } },
    });
  }

  async findByLeccionAdmin(leccionId: string) {
    const formulario = await this.prisma.formularioLeccion.findUnique({
      where: { leccionId },
      include: {
        preguntas: {
          orderBy: { orden: "asc" },
          include: { opciones: { orderBy: { orden: "asc" } } },
        },
      },
    });

    return formulario;
  }

  async update(id: string, dto: UpdateFormularioDto) {
    await this.findOneOrThrow(id);
    return this.prisma.formularioLeccion.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    return this.prisma.formularioLeccion.delete({ where: { id } });
  }


  async addPregunta(formularioId: string, dto: CreatePreguntaDto) {
    await this.findOneOrThrow(formularioId);

    const correctas = dto.opciones.filter((o) => o.esCorrecta).length;
    if (correctas !== 1) {
      throw new BadRequestException("La pregunta debe tener exactamente una opción correcta");
    }

    return this.prisma.preguntaFormulario.create({
      data: {
        formularioId,
        enunciado: dto.enunciado,
        tipoPregunta: dto.tipoPregunta ?? "opcion_unica",
        orden: dto.orden ?? 0,
        opciones: {
          create: dto.opciones.map((o, index) => ({
            texto: o.texto,
            esCorrecta: o.esCorrecta ?? false,
            orden: o.orden ?? index,
          })),
        },
      },
      include: { opciones: true },
    });
  }

  async updatePregunta(id: string, dto: UpdatePreguntaDto) {
    const pregunta = await this.prisma.preguntaFormulario.findUnique({ where: { id } });
    if (!pregunta) throw new NotFoundException("Pregunta no encontrada");

    return this.prisma.preguntaFormulario.update({ where: { id }, data: dto });
  }

  async removePregunta(id: string) {
    const pregunta = await this.prisma.preguntaFormulario.findUnique({ where: { id } });
    if (!pregunta) throw new NotFoundException("Pregunta no encontrada");

    return this.prisma.preguntaFormulario.delete({ where: { id } });
  }


  async addOpcion(preguntaId: string, dto: CreateOpcionDto) {
    const pregunta = await this.prisma.preguntaFormulario.findUnique({ where: { id: preguntaId } });
    if (!pregunta) throw new NotFoundException("Pregunta no encontrada");

    if (dto.esCorrecta) {
      await this.prisma.opcionFormulario.updateMany({
        where: { preguntaFormularioId: preguntaId },
        data: { esCorrecta: false },
      });
    }

    return this.prisma.opcionFormulario.create({
      data: { preguntaFormularioId: preguntaId, ...dto },
    });
  }

  async updateOpcion(id: string, dto: UpdateOpcionDto) {
    const opcion = await this.prisma.opcionFormulario.findUnique({ where: { id } });
    if (!opcion) throw new NotFoundException("Opción no encontrada");

    if (dto.esCorrecta) {
      await this.prisma.opcionFormulario.updateMany({
        where: { preguntaFormularioId: opcion.preguntaFormularioId, NOT: { id } },
        data: { esCorrecta: false },
      });
    }

    return this.prisma.opcionFormulario.update({ where: { id }, data: dto });
  }

  async removeOpcion(id: string) {
    const opcion = await this.prisma.opcionFormulario.findUnique({
      where: { id },
      include: { pregunta: { include: { opciones: true } } },
    });
    if (!opcion) throw new NotFoundException("Opción no encontrada");

    if (opcion.pregunta.opciones.length <= 2) {
      throw new BadRequestException("Cada pregunta necesita al menos 2 opciones");
    }

    return this.prisma.opcionFormulario.delete({ where: { id } });
  }

  private async findOneOrThrow(id: string) {
    const formulario = await this.prisma.formularioLeccion.findUnique({ where: { id } });
    if (!formulario) throw new NotFoundException("Formulario no encontrado");
    return formulario;
  }
}