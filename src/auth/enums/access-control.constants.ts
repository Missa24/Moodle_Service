import { Permission } from './permission.enum';

export const SYSTEM_ROLES = {
    ADMIN: 'ADMIN',
    ESTUDIANTE: 'ESTUDIANTE',
} as const;

export const ESTUDIANTE_PERMISSIONS: readonly string[] = [
    Permission.CURSO_VER,
    Permission.MODULO_VER,
    Permission.LECCION_VER,
    Permission.FORMULARIO_VER,
    Permission.RECURSO_LECCION_VER,
    Permission.CERTIFICADO_VER,
];