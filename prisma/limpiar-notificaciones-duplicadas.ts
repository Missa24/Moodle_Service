import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  const prisma = new PrismaClient({ adapter });

  const notificaciones = await prisma.notificaciones.findMany({
    orderBy: [{ creadoEn: 'asc' }, { id: 'asc' }],
    select: { id: true, usuarioId: true, tipo: true, titulo: true },
  });

  const vistos = new Map<string, string>();
  const aEliminar: string[] = [];

  for (const notificacion of notificaciones) {
    const clave = `${notificacion.usuarioId}::${notificacion.tipo}::${notificacion.titulo}`;

    if (vistos.has(clave)) {
      aEliminar.push(notificacion.id);
    } else {
      vistos.set(clave, notificacion.id);
    }
  }

  if (aEliminar.length > 0) {
    const resultado = await prisma.notificaciones.deleteMany({
      where: { id: { in: aEliminar } },
    });

    console.log(`Notificaciones duplicadas eliminadas: ${resultado.count}`);
  } else {
    console.log('No se encontraron notificaciones duplicadas.');
  }

  console.log(
    `Total de notificaciones: ${notificaciones.length} | Únicas por usuario+tipo+titulo: ${vistos.size}`,
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});