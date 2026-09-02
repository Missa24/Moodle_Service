export type ProgresoModuloResultado = {
    id: string;
    inscripcionId: string;

    modulo: {
        id: string;
        nombre: string;
        cursoId: string;
    };

    estado: string;
    porcentaje: number;

    leccionesTotales: number;
    leccionesCompletadas: number;
    leccionesPendientes: number;

    completadoEn: Date | null;
    actualizadoEn: Date;

    transicionACompletado?: boolean;
    cursoCompleto?: boolean;
};