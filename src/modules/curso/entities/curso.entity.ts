export class Curso {
  id!: string;
  nombre!: string;
  categoria?: string;
  slug!: string;
  descripcionCorta?: string;
  descripcionCompleta?: string;
  duracionHoras?: number;
  rutaPortada?: string;
  rutaImagenSecundaria?: string;
  estado!: string;
  creadoPor?: string;
  creadoEn!: Date;
  actualizadoEn!: Date;
}