/*
  Warnings:

  - A unique constraint covering the columns `[usuarioId,cursoId]` on the table `ventas_cursos` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "ventas_cursos_detalles" (
    "id" TEXT NOT NULL,
    "ventaCursoId" TEXT NOT NULL,
    "moduloId" TEXT,
    "moduloNombre" TEXT NOT NULL,
    "moduloOrden" INTEGER NOT NULL,
    "precioModulo" DECIMAL(10,2) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_cursos_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ventas_cursos_detalles_ventaCursoId_idx" ON "ventas_cursos_detalles"("ventaCursoId");

-- CreateIndex
CREATE INDEX "ventas_cursos_detalles_moduloId_idx" ON "ventas_cursos_detalles"("moduloId");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_cursos_detalles_ventaCursoId_moduloId_key" ON "ventas_cursos_detalles"("ventaCursoId", "moduloId");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_cursos_usuarioId_cursoId_key" ON "ventas_cursos"("usuarioId", "cursoId");

-- AddForeignKey
ALTER TABLE "ventas_cursos_detalles" ADD CONSTRAINT "ventas_cursos_detalles_ventaCursoId_fkey" FOREIGN KEY ("ventaCursoId") REFERENCES "ventas_cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_cursos_detalles" ADD CONSTRAINT "ventas_cursos_detalles_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "modulos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
