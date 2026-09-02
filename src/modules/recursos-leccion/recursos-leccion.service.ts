import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateRecursoLeccionDto } from "./dto/create-recursos-leccion.dto";
import { UpdateRecursoLeccionDto } from "./dto/update-recursos-leccion.dto";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";


@Injectable()
export class RecursoLeccionService {
  constructor(private readonly prisma: PrismaService, private readonly cloudinaryService: CloudinaryService) { }

  async create(
    leccionId: string,
    dto: CreateRecursoLeccionDto,
    file?: Express.Multer.File,
  ) {
    const leccion = await this.prisma.leccion.findUnique({
      where: { id: leccionId },
    });

    if (!leccion) {
      throw new NotFoundException("Lección no encontrada");
    }

    let rutaRecurso: string | undefined;

    if (file) {
      const imagen = await this.cloudinaryService.uploadFile(file, "lms/recursos",);

      rutaRecurso = imagen.url;
    }

    return this.prisma.recursosLeccion.create({
      data: {
        ...dto,
        leccionId,
        rutaRecurso,
      },
    });
  }


  async findByLeccion(leccionId: string) {
    return this.prisma.recursosLeccion.findMany({
      where: { leccionId },
      orderBy: { orden: "asc" },
    });
  }

  async findOne(id: string) {
    const recurso = await this.prisma.recursosLeccion.findUnique({ where: { id } });
    if (!recurso) {
      throw new NotFoundException("Recurso no encontrado");
    }
    return recurso;
  }

  async update(
    id: string,
    dto: UpdateRecursoLeccionDto,
    file?: Express.Multer.File,
  ) {
    await this.findOne(id);

    let rutaRecurso: string | undefined;

    if (file) {
      const imagen = await this.cloudinaryService.uploadFile(
        file,
        "lms/recursos",
      );

      rutaRecurso = imagen.url;
    }

    return this.prisma.recursosLeccion.update({
      where: { id },
      data: {
        ...dto,
        ...(rutaRecurso && { rutaRecurso }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.recursosLeccion.delete({ where: { id } });
  }
}