import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { Permission } from '../src/auth/enums/permission.enum';
import {
    ESTUDIANTE_PERMISSIONS,
    SYSTEM_ROLES,
} from '../src/auth/enums/access-control.constants';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Iniciando seed de producción...');

    // 1. Crear todos los permisos del sistema
    const permisos = Object.values(Permission);

    await prisma.permiso.createMany({
        data: permisos.map(nombre => ({
            nombre,
            descripcion: nombre,
            estado: 'activo',
        })),
        skipDuplicates: true,
    });

    // 2. Crear roles base
    const rolAdmin = await prisma.rol.upsert({
        where: { nombre: SYSTEM_ROLES.ADMIN },
        update: {
            descripcion: 'Administrador del sistema',
            estado: 'activo',
        },
        create: {
            nombre: SYSTEM_ROLES.ADMIN,
            descripcion: 'Administrador del sistema',
            estado: 'activo',
        },
    });

    const rolEstudiante = await prisma.rol.upsert({
        where: { nombre: SYSTEM_ROLES.ESTUDIANTE },
        update: {
            descripcion: 'Estudiante de la plataforma',
            estado: 'activo',
        },
        create: {
            nombre: SYSTEM_ROLES.ESTUDIANTE,
            descripcion: 'Estudiante de la plataforma',
            estado: 'activo',
        },
    });

    // 3. Obtener permisos
    const todosLosPermisos = await prisma.permiso.findMany({
        where: { estado: 'activo' },
        select: { id: true, nombre: true },
    });

    const permisosEstudiante = todosLosPermisos.filter(permiso =>
        ESTUDIANTE_PERMISSIONS.includes(permiso.nombre),
    );

    const encontrados = new Set(permisosEstudiante.map(p => p.nombre));
    const faltantes = ESTUDIANTE_PERMISSIONS.filter(p => !encontrados.has(p));

    if (faltantes.length) {
        throw new Error(`Faltan permisos del estudiante: ${faltantes.join(', ')}`);
    }

    const idsAdmin = todosLosPermisos.map(p => p.id);
    const idsEstudiante = permisosEstudiante.map(p => p.id);

    // 4. Sincronizar permisos de ambos roles
    await prisma.$transaction([
        prisma.rolPermiso.deleteMany({
            where: {
                rolId: rolAdmin.id,
                permisoId: { notIn: idsAdmin },
            },
        }),

        prisma.rolPermiso.createMany({
            data: idsAdmin.map(permisoId => ({
                rolId: rolAdmin.id,
                permisoId,
            })),
            skipDuplicates: true,
        }),

        prisma.rolPermiso.deleteMany({
            where: {
                rolId: rolEstudiante.id,
                permisoId: { notIn: idsEstudiante },
            },
        }),

        prisma.rolPermiso.createMany({
            data: idsEstudiante.map(permisoId => ({
                rolId: rolEstudiante.id,
                permisoId,
            })),
            skipDuplicates: true,
        }),
    ]);

    // 5. Datos del primer administrador
    const correo = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    const username = process.env.ADMIN_USERNAME?.trim() || 'admin';
    const nombre = process.env.ADMIN_NAME?.trim() || 'Administrador';

    if (!correo || !password) {
        throw new Error(
            'Debes configurar ADMIN_EMAIL y ADMIN_PASSWORD para ejecutar el seed',
        );
    }

    // 6. Crear administrador solamente si todavía no existe
    let admin = await prisma.usuario.findUnique({
        where: { correo },
    });

    if (!admin) {
        const contrasenaHash = await bcrypt.hash(password, 12);

        admin = await prisma.usuario.create({
            data: {
                username,
                correo,
                contrasenaHash,
                estado: 'activo',
                correoVerificadoEn: new Date(),
                perfil: {
                    create: {
                        nombre,
                    },
                },
            },
        });

        console.log(`👤 Administrador creado: ${correo}`);
    } else {
        console.log(`👤 El administrador ya existe: ${correo}`);
    }

    // 7. Asegurar rol ADMIN
    await prisma.usuarioRol.upsert({
        where: {
            usuarioId_rolId: {
                usuarioId: admin.id,
                rolId: rolAdmin.id,
            },
        },
        update: {},
        create: {
            usuarioId: admin.id,
            rolId: rolAdmin.id,
        },
    });

    // Quitar rol ESTUDIANTE si accidentalmente lo tuviera
    await prisma.usuarioRol.deleteMany({
        where: {
            usuarioId: admin.id,
            rolId: rolEstudiante.id,
        },
    });

    console.log(`✅ ADMIN: ${idsAdmin.length} permisos`);
    console.log(`✅ ESTUDIANTE: ${idsEstudiante.length} permisos`);
    console.log('✅ Seed completado');
}

main()
    .catch(error => {
        console.error('❌ Error ejecutando seed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });