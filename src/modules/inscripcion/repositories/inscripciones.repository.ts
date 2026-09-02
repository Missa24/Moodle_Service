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

type EstudianteConInscripciones = {
  id: string;
  correo: string;
  estado: string;

  perfil: {
    nombre: string | null;
    apellidoPaterno: string | null;
    apellidoMaterno: string | null;
  } | null;

  inscripciones: {
    id: string;
    numeroInscripcion: string;
    estadoAcceso: string;

    modulo: {
      id: string;
      nombre: string;
      orden: number;

      curso: {
        id: string;
        nombre: string;
        categoria: {
          nombre: string;
        };
      };
    };
  }[];
};

type InscripcionConModuloCurso = {
  id: string;
  moduloId: string;
  estudianteId: string;
  numeroInscripcion: string;
  fechaInscripcion: Date;
  fechaFinalizacion: Date | null;
  estado: string;
  estadoAcceso: string;
  porcentajeAvance: number;
  observaciones: string | null;
  inscritoPor: string | null;

  modulo: {
    id: string;
    nombre: string;
    orden: number;

    curso: {
      id: string;
      nombre: string;
      categoria: {
        nombre: string;
      };
    };
  };
};

export abstract class InscripcionesRepository {
  abstract findAll(): Promise<unknown[]>;

  abstract findById(id: string): Promise<Inscripcion | null>;

  abstract findByIdWithCurso(id: string): Promise<InscripcionConModuloCurso | null>;

  abstract create(data: {
    moduloId: string;
    estudianteId: string;
    numeroInscripcion: string;
  }): Promise<unknown>;

  abstract update(id: string, data: unknown): Promise<unknown>;

  abstract delete(id: string): Promise<void>;

  // metodo obtener inscripciones paginado
  abstract findEstudianteWithInscripciones(skip: number, take: number, search?: string): Promise<EstudianteConInscripciones[]>;
  abstract countEstudiantesWithInscripciones(search?: string): Promise<number>;

  abstract findByEstudianteId(estudianteId: string): Promise<Inscripcion[]>;

  // metodo crear inscripcion con varios pares estudiante-modulo
  abstract createMultiple(data: {
    inscripciones: {
      estudianteId: string;
      moduloId: string;
      numeroInscripcion: string;
    }[];
  }): Promise<unknown>;

  // metodo obtener inscripciones de un estudiante por estudianteId
  abstract findByEstudianteInscripciones(estudianteId: string): Promise<InscripcionConModuloCurso[]>;
}