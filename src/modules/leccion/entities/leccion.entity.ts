export class Leccion {
  id!: string;
  moduloId!: string;
  nombre!: string;
  descripcion?: string;
  contenidoHtml?: string;
  tipoLeccion!: string;
  urlVideo?: string;
  proveedorVideo?: string;
  orden!: number;
  esVistaPrevia!: boolean;
  requiereLeccionAnteriorCompletada!: boolean;
  estaPublicada!: boolean;
  creadoEn!: Date;
  actualizadoEn!: Date;
}