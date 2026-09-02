import { Injectable, NotFoundException } from '@nestjs/common';
import { InscripcionesRepository } from 'src/modules/inscripcion/repositories/inscripciones.repository';
import { CreateInscripcionDto } from 'src/modules/inscripcion/dto/create-inscripcion.dto';
import { UpdateInscripcionDto } from './dto/update-inscripcion.dto';
import { CreateInscripcionEstudiantesDto } from './dto/create-inscripcion-estudiantes.dto';
import { ModuloService } from 'src/modules/modulo/modulo.service';
import { UserService } from 'src/modules/user/user.service';

type Inscripcion = {
  id: string;
  moduloId: string;
  estudianteId: string;
  numeroInscripcion: string;
  fechaInscripcion: Date;
  estado: string;
  estadoAcceso: string;
  porcentajeAvance: number;
  fechaFinalizacion: Date | null;
  observaciones: string | null;
  inscritoPor: string | null;
}

type ModuloAgrupado = {
  id: string;
  nombre: string;
  orden: number;
  estadoAcceso: string;
  numeroInscripcion?: string;
};

type ModuloAgrupadoConDetalles = {
  id: string;
  nombre: string;
  orden: number;
  inscripcion: Inscripcion;
};

type CursoAgrupado = {
  id: string;
  nombre: string;
  categoria: {
    nombre: string;
  };
  modulos: ModuloAgrupado[];
};

type CursoAgrupadoConDetalles = {
  id: string;
  nombre: string;
  categoria: {
    nombre: string;
  };
  modulos: ModuloAgrupadoConDetalles[];
};

type EstudianteAgrupado = {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correo: string;
  cursos: CursoAgrupado[];
};

@Injectable()
export class InscripcionesService {
  constructor(
    private readonly inscripcionesRepository: InscripcionesRepository,
    private readonly moduloService: ModuloService,
    private readonly usuarioService: UserService,
  ) { }

  private generarNumeroInscripcion(): string {
    return `INS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  async findAll() {
    return this.inscripcionesRepository.findAll();
  }

  async findById(id: string) {
    return this.inscripcionesRepository.findById(id);
  }

  async create(data: CreateInscripcionDto) {
    const [modulo, estudiante] = await Promise.all([
      this.moduloService.findOne(data.moduloId),
      this.usuarioService.findOne(data.estudianteId)
    ]);

    if (!modulo) throw new NotFoundException('Módulo no encontrado1');
    if (!estudiante) throw new NotFoundException('Estudiante no encontrado');

    // buscar si el estudiante ya está inscrito en el módulo
    const inscripcionesExistentes = await this.inscripcionesRepository.findByEstudianteId(data.estudianteId);
    const yaInscrito = inscripcionesExistentes.some((inscripcion: Inscripcion) => inscripcion.moduloId === data.moduloId);

    if (yaInscrito) {
      throw new NotFoundException('El estudiante ya está inscrito en este módulo');
    }

    const numeroInscripcion = this.generarNumeroInscripcion();
    return this.inscripcionesRepository.create({
      ...data,
      numeroInscripcion,
    });
  }

  async update(id: string, data: UpdateInscripcionDto) {
    const inscripcion = await this.inscripcionesRepository.findById(id);
    if (!inscripcion) {
      throw new NotFoundException(`Inscripción con id ${id} no encontrada`);
    }
    return this.inscripcionesRepository.update(id, data);
  }

  async delete(id: string) {
    const inscripcion = await this.inscripcionesRepository.findById(id);
    if (!inscripcion) {
      throw new NotFoundException(`Inscripción con id ${id} no encontrada`);
    }
    return this.inscripcionesRepository.delete(id);
  }

  // eliminar todo el curso con sus modulos inscritos del estudiante
  async eliminarCursoInscripciones(idEstudiante: string, idCurso: string) {
    const inscripciones = await this.inscripcionesRepository.findByEstudianteInscripciones(idEstudiante);
    const inscripcionesCurso = inscripciones.filter(inscripcion => inscripcion.modulo.curso.id === idCurso);

    if (inscripcionesCurso.length === 0) {
      throw new NotFoundException(`No se encontraron inscripciones para el estudiante con id ${idEstudiante} en el curso con id ${idCurso}`);
    }

    for (const inscripcion of inscripcionesCurso) {
      await this.inscripcionesRepository.delete(inscripcion.id);
    }

    return { message: `Se eliminaron ${inscripcionesCurso.length} inscripciones del estudiante con id ${idEstudiante} en el curso con id ${idCurso}` };
  }

  async eliminarModuloInscripciones(id: string, idCurso: string, idModulo: string) {
    const inscripcion = await this.inscripcionesRepository.findByIdWithCurso(id);

    if (!inscripcion) {
      throw new NotFoundException(`Inscripción con id ${id} no encontrada`);
    }

    if (inscripcion.modulo.curso.id !== idCurso || inscripcion.modulo.id !== idModulo) {
      throw new NotFoundException(`La inscripción con id ${id} no pertenece al curso con id ${idCurso} y módulo con id ${idModulo}`);
    }

    await this.inscripcionesRepository.delete(id);

    return { message: `Se eliminó la inscripción con id ${id} del estudiante en el curso con id ${idCurso} y módulo con id ${idModulo}` };
  }

  async eliminarTodasInscripciones(idEstudiante: string) {
    const inscripciones = await this.inscripcionesRepository.findByEstudianteInscripciones(idEstudiante);

    if (inscripciones.length === 0) {
      throw new NotFoundException(`No se encontraron inscripciones para el estudiante con id ${idEstudiante}`);
    }

    for (const inscripcion of inscripciones) {
      await this.inscripcionesRepository.delete(inscripcion.id);
    }

    return { message: `Se eliminaron todas las inscripciones del estudiante con id ${idEstudiante}` };
  }

  async findAllPaginated(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const [estudiantes, total] = await Promise.all([
      this.inscripcionesRepository.findEstudianteWithInscripciones(skip, limit, search),
      this.inscripcionesRepository.countEstudiantesWithInscripciones(search)
    ]);

    const resultado: EstudianteAgrupado[] = estudiantes.map((estudiante) => {
      const cursos = new Map<string, CursoAgrupado>();

      for (const inscripcion of estudiante.inscripciones) {
        const cursoId = inscripcion.modulo.curso.id;

        let curso = cursos.get(cursoId);

        if (!curso) {
          curso = {
            id: cursoId,
            nombre: inscripcion.modulo.curso.nombre,
            categoria: inscripcion.modulo.curso.categoria,
            modulos: [],
          };

          cursos.set(cursoId, curso);
        }

        curso.modulos.push({
          id: inscripcion.modulo.id,
          nombre: inscripcion.modulo.nombre,
          orden: inscripcion.modulo.orden,
          numeroInscripcion: inscripcion.numeroInscripcion,
          estadoAcceso: inscripcion.estadoAcceso,
        });
      }

      return {
        id: estudiante.id,
        nombre: estudiante.perfil?.nombre ?? '',
        apellidoPaterno: estudiante.perfil?.apellidoPaterno ?? '',
        apellidoMaterno: estudiante.perfil?.apellidoMaterno ?? '',
        correo: estudiante.correo,
        estado: estudiante.estado,

        cursos: Array.from(cursos.values()).map((curso) => ({
          ...curso,
          modulos: curso.modulos.sort(
            (a, b) => a.orden - b.orden,
          ),
        })),
      };
    });

    return {
      data: resultado,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    }
  }

  // metodo crear inscripcion con varios estudianteId a diferentes modulos
  async createMultiple(data: CreateInscripcionEstudiantesDto) {
    const [modulos, estudiantes] = await Promise.all([
      Promise.all(data.moduloIds.map(id => this.moduloService.findOne(id))),
      Promise.all(data.estudianteIds.map(id => this.usuarioService.findOne(id)))
    ]);

    if (!modulos || modulos.some(modulo => !modulo)) throw new NotFoundException('Módulo no encontrado');
    const estudiantesExistentes = estudiantes.filter(estudiante => estudiante !== null);

    // buscar inscripciones existentes para todos los estudiantes
    const inscripcionesExistentes = await Promise.all(
      estudiantesExistentes.map(estudiante => this.inscripcionesRepository.findByEstudianteId(estudiante.id))
    );

    // construir Set de pares (estudianteId, moduloId) que ya existen
    const paresExistentes = new Set(
      inscripcionesExistentes.flat().map((inscripcion: Inscripcion) => `${inscripcion.estudianteId}-${inscripcion.moduloId}`)
    );

    // generar pares estudiante-modulo que no existen
    const inscripcionesNuevas: { estudianteId: string; moduloId: string; numeroInscripcion: string }[] = [];
    for (const estudiante of estudiantesExistentes) {
      for (const moduloId of data.moduloIds) {
        const par = `${estudiante.id}-${moduloId}`;
        if (!paresExistentes.has(par)) {
          inscripcionesNuevas.push({
            estudianteId: estudiante.id,
            moduloId,
            numeroInscripcion: this.generarNumeroInscripcion(),
          });
        }
      }
    }

    return this.inscripcionesRepository.createMultiple({
      inscripciones: inscripcionesNuevas,
    });
  }

  // metodo obtener inscripciones de un estudiante por estudianteId
  async findByEstudianteInscripciones(estudianteId: string) {
    const inscripciones = await this.inscripcionesRepository.findByEstudianteInscripciones(estudianteId);

    const cursos = new Map<string, CursoAgrupadoConDetalles>();

    for (const inscripcion of inscripciones) {
      const cursoId = inscripcion.modulo.curso.id;

      let curso = cursos.get(cursoId);

      if (!curso) {
        curso = {
          id: cursoId,
          nombre: inscripcion.modulo.curso.nombre,
          categoria: inscripcion.modulo.curso.categoria,
          modulos: [],
        };

        cursos.set(cursoId, curso);
      }

      curso.modulos.push({
        id: inscripcion.modulo.id,
        nombre: inscripcion.modulo.nombre,
        orden: inscripcion.modulo.orden,

        inscripcion: {
          id: inscripcion.id,
          moduloId: inscripcion.modulo.id,
          estudianteId: inscripcion.estudianteId,
          numeroInscripcion: inscripcion.numeroInscripcion,
          fechaInscripcion: inscripcion.fechaInscripcion,
          estado: inscripcion.estado,
          estadoAcceso: inscripcion.estadoAcceso,
          porcentajeAvance: inscripcion.porcentajeAvance,
          fechaFinalizacion: inscripcion.fechaFinalizacion,
          observaciones: inscripcion.observaciones,
          inscritoPor: inscripcion.inscritoPor,
        },
      });
    }

    return Array.from(cursos.values()).map((curso) => ({
      ...curso,
      modulos: curso.modulos.sort(
        (a, b) => a.orden - b.orden,
      ),
    }));
  }
}
