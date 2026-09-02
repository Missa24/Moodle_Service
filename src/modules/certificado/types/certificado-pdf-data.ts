export interface CertificadoPdfData {
    id: string;
    tipo: string;
    nombre: string;
    modulo: string;
    curso: string;
    fecha: Date;
    codigoVerificacion: string;
    numeroCertificado: string;
    urlVerificacion: string;
    titulo: string;
}


export interface CertificadoCursoPdfData {
    id: string;
    tipo: string;
    nombre: string;
    curso: string;
    fecha: Date;
    codigoVerificacion: string;
    numeroCertificado: string;
    urlVerificacion: string;
    titulo: string;
    resumen: string;
    cargaHoraria: string;
}



