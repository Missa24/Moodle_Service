/*
  Warnings:

  - A unique constraint covering the columns `[usuarioId,moduloId]` on the table `leads` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `actualizadoEn` to the `leads` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoLead" AS ENUM ('INTERESADO', 'PAGO_INICIADO', 'CONVERTIDO', 'DESCARTADO');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "actualizadoEn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "convertidoEn" TIMESTAMP(3),
ADD COLUMN     "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "estado" "EstadoLead" NOT NULL DEFAULT 'INTERESADO',
ADD COLUMN     "ultimoIntentoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "leads_estado_idx" ON "leads"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "leads_usuarioId_moduloId_key" ON "leads"("usuarioId", "moduloId");
