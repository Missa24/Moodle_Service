import { PrismaClient } from '@prisma/client';

export async function seedInscripciones(prisma: PrismaClient) {
  const estudiantes = await prisma.usuario.findMany({
    where: { roles: { some: { rol: { nombre: 'ESTUDIANTE' } } } },
    select: { id: true, username: true },
    orderBy: { createdAt: 'asc' },
  });

  const modulos = await prisma.modulo.findMany({
    select: { id: true, nombre: true, curso: { select: { nombre: true } } },
    orderBy: { creadoEn: 'asc' },
  });

  console.log(`📋 Iniciando siembra de inscripciones para ${estudiantes.length} estudiantes en ${modulos.length} módulos...`);

  let contador = 4;
  const inscripcionesTotales: number[] = [];

  for (const estudiante of estudiantes) {
    const cantidadModulos = 3 + Math.floor(Math.random() * 3); // 3 a 5
    const modulosAleatorios = shuffleArray(modulos).slice(0, cantidadModulos);

    for (const modulo of modulosAleatorios) {
      contador++;
      const numero = String(contador).padStart(4, '0');
      const numeroInscripcion = `INS-${numero}`;

      // Verificar si la inscripción ya existe
      const existente = await prisma.inscripcion.findFirst({
        where: {
          moduloId: modulo.id,
          estudianteId: estudiante.id,
        },
        select: { id: true },
      });

      if (existente) {
        console.log(`  ⏭️  ${numeroInscripcion} - ${estudiante.username} → ${modulo.nombre} (ya existe)`);
        continue;
      }

      await prisma.inscripcion.create({
        data: {
          moduloId: modulo.id,
          estudianteId: estudiante.id,
          numeroInscripcion,
          estado: 'activa',
          estadoAcceso: 'habilitado',
          porcentajeAvance: 0,
          monto: 0,
          inscritoPor: null,
          observaciones: null,
        },
      });

      console.log(`  ✅ ${numeroInscripcion} - ${estudiante.username} → ${modulo.nombre}`);
    }

    inscripcionesTotales.push(cantidadModulos);
  }

  const total = inscripcionesTotales.reduce((a, b) => a + b, 0);

  console.log(`\n🎉 ¡${total} inscripciones sembradas con éxito!`);
  console.log('--------------------------------------------------');
  console.log(`  👨‍🎓 Estudiantes: ${estudiantes.length}`);
  console.log(`  📚 Promedio módulos por estudiante: ${(total / estudiantes.length).toFixed(1)}`);
  console.log(`  📊 Rango: ${Math.min(...inscripcionesTotales)} - ${Math.max(...inscripcionesTotales)} módulos/estudiante`);
  console.log('--------------------------------------------------');
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
