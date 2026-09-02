export class Modulo {
  id!: string;
  cursoId!: string;
  nombre!: string;
  descripcion?: string;
  fraseMotivacional?: string;
  rutaImagen?: string;
  orden!: number;
  otorgaCertificacion!: boolean;
  estaPublicado!: boolean;
  creadoEn!: Date;
  actualizadoEn!: Date;
}