export class RecursosLeccion {
  id!: string;
  leccionId!: string;
  nombre!: string;
  descripcion?: string;
  tipoRecurso!: string;
  rutaRecurso?: string;
  urlExterna?: string;
  orden!: number;
  creadoEn!: Date;
  actualizadoEn!: Date;
}