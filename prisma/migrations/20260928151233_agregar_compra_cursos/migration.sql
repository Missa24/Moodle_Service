/*
  Warnings:

  - A unique constraint covering the columns `[moduloId,estudianteId]` on the table `inscripciones` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[usuarioId,cursoId]` on the table `leads` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TipoDescuentoCurso" AS ENUM ('PORCENTAJE', 'MODULO_GRATIS');

-- CreateEnum
CREATE TYPE "TipoCompra" AS ENUM ('MODULO', 'CURSO');

-- AlterTable
ALTER TABLE "inscripciones" ADD COLUMN     "ventaCursoId" TEXT;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "cursoId" TEXT,
ADD COLUMN     "tipoCompra" "TipoCompra" NOT NULL DEFAULT 'MODULO',
ALTER COLUMN "moduloId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "configuraciones_venta_curso" (
    "id" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "tipoDescuento" "TipoDescuentoCurso" NOT NULL,
    "porcentaje" DECIMAL(5,2),
    "moduloDescuentoId" TEXT,
    "urlPago" TEXT,
    "urlPagoBolivia" TEXT,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuraciones_venta_curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_cursos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "leadId" TEXT,
    "precioBase" DECIMAL(10,2) NOT NULL,
    "descuentoTipo" "TipoDescuentoCurso",
    "descuentoValor" DECIMAL(10,2),
    "moduloDescuentoId" TEXT,
    "moduloDescuentoNombre" TEXT,
    "moduloDescuentoPrecio" DECIMAL(10,2),
    "montoDescuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "montoCobrado" DECIMAL(10,2) NOT NULL,
    "comision" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "comisionConfirmada" BOOLEAN NOT NULL DEFAULT false,
    "moneda" VARCHAR(3) NOT NULL,
    "medioPago" "MedioPago" NOT NULL,
    "paisCodigo" CHAR(2),
    "referenciaPago" TEXT,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_cursos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_venta_curso_cursoId_key" ON "configuraciones_venta_curso"("cursoId");

-- CreateIndex
CREATE INDEX "configuraciones_venta_curso_moduloDescuentoId_idx" ON "configuraciones_venta_curso"("moduloDescuentoId");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_cursos_leadId_key" ON "ventas_cursos"("leadId");

-- CreateIndex
CREATE INDEX "ventas_cursos_usuarioId_idx" ON "ventas_cursos"("usuarioId");

-- CreateIndex
CREATE INDEX "ventas_cursos_cursoId_idx" ON "ventas_cursos"("cursoId");

-- CreateIndex
CREATE INDEX "ventas_cursos_creadoEn_idx" ON "ventas_cursos"("creadoEn");

-- CreateIndex
CREATE INDEX "inscripciones_estudianteId_idx" ON "inscripciones"("estudianteId");

-- CreateIndex
CREATE INDEX "inscripciones_ventaCursoId_idx" ON "inscripciones"("ventaCursoId");

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_moduloId_estudianteId_key" ON "inscripciones"("moduloId", "estudianteId");

-- CreateIndex
CREATE INDEX "leads_cursoId_idx" ON "leads"("cursoId");

-- CreateIndex
CREATE INDEX "leads_tipoCompra_idx" ON "leads"("tipoCompra");

-- CreateIndex
CREATE UNIQUE INDEX "leads_usuarioId_cursoId_key" ON "leads"("usuarioId", "cursoId");

-- CreateIndex
CREATE INDEX "lecciones_moduloId_idx" ON "lecciones"("moduloId");

-- CreateIndex
CREATE INDEX "modulos_cursoId_idx" ON "modulos"("cursoId");

-- CreateIndex
CREATE INDEX "opciones_formulario_preguntaFormularioId_idx" ON "opciones_formulario"("preguntaFormularioId");

-- CreateIndex
CREATE INDEX "preguntas_formulario_formularioId_idx" ON "preguntas_formulario"("formularioId");

-- CreateIndex
CREATE INDEX "progreso_lecciones_leccionId_idx" ON "progreso_lecciones"("leccionId");

-- CreateIndex
CREATE INDEX "recursos_leccion_leccionId_idx" ON "recursos_leccion"("leccionId");

-- CreateIndex
CREATE INDEX "respuestas_formulario_progresoLeccionId_idx" ON "respuestas_formulario"("progresoLeccionId");

-- CreateIndex
CREATE INDEX "respuestas_formulario_preguntaFormularioId_idx" ON "respuestas_formulario"("preguntaFormularioId");

-- AddForeignKey
ALTER TABLE "configuraciones_venta_curso" ADD CONSTRAINT "configuraciones_venta_curso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuraciones_venta_curso" ADD CONSTRAINT "configuraciones_venta_curso_moduloDescuentoId_fkey" FOREIGN KEY ("moduloDescuentoId") REFERENCES "modulos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_cursos" ADD CONSTRAINT "ventas_cursos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_cursos" ADD CONSTRAINT "ventas_cursos_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_cursos" ADD CONSTRAINT "ventas_cursos_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_ventaCursoId_fkey" FOREIGN KEY ("ventaCursoId") REFERENCES "ventas_cursos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
