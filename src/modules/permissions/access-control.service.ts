import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { Permission } from 'src/auth/enums/permission.enum';
import {
    ESTUDIANTE_PERMISSIONS,
    SYSTEM_ROLES,
} from 'src/auth/enums/access-control.constants';

type RoleDbClient = Pick<Prisma.TransactionClient, 'rol' | 'usuarioRol'>;

@Injectable()
export class AccessControlService implements OnModuleInit {
    private readonly logger = new Logger(AccessControlService.name);

    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit(): Promise<void> {
        await this.sincronizar();
    }

    async sincronizar(): Promise<void> {
        await this.crearPermisosFaltantes();

        const [rolAdmin, rolEstudiante] = await Promise.all([
            this.obtenerOCrearRol(SYSTEM_ROLES.ADMIN, 'Administrador del sistema'),
            this.obtenerOCrearRol(SYSTEM_ROLES.ESTUDIANTE, 'Estudiante de la plataforma'),
        ]);

        const [todosLosPermisos, permisosEstudiante] = await Promise.all([
            this.prisma.permiso.findMany({
                where: { estado: 'activo' },
                select: { id: true, nombre: true },
            }),
            this.prisma.permiso.findMany({
                where: {
                    estado: 'activo',
                    nombre: { in: [...ESTUDIANTE_PERMISSIONS] },
                },
                select: { id: true, nombre: true },
            }),
        ]);

        const permisosEncontrados = new Set(
            permisosEstudiante.map(permiso => permiso.nombre),
        );

        const faltantes = ESTUDIANTE_PERMISSIONS.filter(
            nombre => !permisosEncontrados.has(nombre),
        );

        if (faltantes.length > 0) {
            throw new Error(
                `Faltan permisos del estudiante: ${faltantes.join(', ')}`,
            );
        }

        const idsPermisosEstudiante = permisosEstudiante.map(permiso => permiso.id);
        const idsPermisosAdmin = todosLosPermisos.map(permiso => permiso.id);

        await this.prisma.$transaction([
            this.prisma.rolPermiso.deleteMany({
                where: {
                    rolId: rolEstudiante.id,
                    permisoId: { notIn: idsPermisosEstudiante },
                },
            }),
            this.prisma.rolPermiso.createMany({
                data: idsPermisosEstudiante.map(permisoId => ({
                    rolId: rolEstudiante.id,
                    permisoId,
                })),
                skipDuplicates: true,
            }),
            this.prisma.rolPermiso.deleteMany({
                where: {
                    rolId: rolAdmin.id,
                    permisoId: { notIn: idsPermisosAdmin },
                },
            }),
            this.prisma.rolPermiso.createMany({
                data: idsPermisosAdmin.map(permisoId => ({
                    rolId: rolAdmin.id,
                    permisoId,
                })),
                skipDuplicates: true,
            }),
        ]);

        this.logger.log(
            `Permisos sincronizados: ESTUDIANTE=${idsPermisosEstudiante.length}, ADMIN=${idsPermisosAdmin.length}`,
        );
    }

    async asignarRolEstudiante(
        usuarioId: string,
        db: RoleDbClient = this.prisma,
    ): Promise<void> {
        await this.asignarRol(usuarioId, SYSTEM_ROLES.ESTUDIANTE, db);
    }

    async asignarRolAdmin(
        usuarioId: string,
        db: RoleDbClient = this.prisma,
    ): Promise<void> {
        await this.asignarRol(usuarioId, SYSTEM_ROLES.ADMIN, db);
    }

    async convertirEnAdmin(usuarioId: string): Promise<void> {
        await this.prisma.$transaction(async tx => {
            const rolAdmin = await tx.rol.findUnique({
                where: { nombre: SYSTEM_ROLES.ADMIN },
                select: { id: true },
            });

            if (!rolAdmin) {
                throw new Error('El rol ADMIN no está configurado');
            }

            await tx.usuarioRol.upsert({
                where: {
                    usuarioId_rolId: {
                        usuarioId,
                        rolId: rolAdmin.id,
                    },
                },
                update: {},
                create: {
                    usuarioId,
                    rolId: rolAdmin.id,
                },
            });

            const rolEstudiante = await tx.rol.findUnique({
                where: { nombre: SYSTEM_ROLES.ESTUDIANTE },
                select: { id: true },
            });

            if (rolEstudiante) {
                await tx.usuarioRol.deleteMany({
                    where: {
                        usuarioId,
                        rolId: rolEstudiante.id,
                    },
                });
            }
        });
    }

    private async crearPermisosFaltantes(): Promise<void> {
        const permisos: string[] = Object.values(Permission);

        await this.prisma.permiso.createMany({
            data: permisos.map(nombre => ({
                nombre,
                descripcion: nombre,
                estado: 'activo',
            })),
            skipDuplicates: true,
        });
    }

    private async obtenerOCrearRol(nombre: string, descripcion: string) {
        return this.prisma.rol.upsert({
            where: { nombre },
            update: {
                descripcion,
                estado: 'activo',
            },
            create: {
                nombre,
                descripcion,
                estado: 'activo',
            },
        });
    }

    private async asignarRol(
        usuarioId: string,
        nombreRol: string,
        db: RoleDbClient,
    ): Promise<void> {
        const rol = await db.rol.findUnique({
            where: { nombre: nombreRol },
            select: { id: true },
        });

        if (!rol) {
            throw new Error(`El rol ${nombreRol} no está configurado`);
        }

        await db.usuarioRol.upsert({
            where: {
                usuarioId_rolId: {
                    usuarioId,
                    rolId: rol.id,
                },
            },
            update: {},
            create: {
                usuarioId,
                rolId: rol.id,
            },
        });
    }
}