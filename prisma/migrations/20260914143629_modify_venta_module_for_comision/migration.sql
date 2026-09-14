/*
  Warnings:

  - You are about to drop the column `totalPagado` on the `ventas_modulos` table. All the data in the column will be lost.
  - Added the required column `moneda` to the `ventas_modulos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `montoCobrado` to the `ventas_modulos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ventas_modulos" DROP COLUMN "totalPagado",
ADD COLUMN     "comision" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "comisionConfirmada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moneda" VARCHAR(3) NOT NULL,
ADD COLUMN     "montoCobrado" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "observaciones" TEXT,
ADD COLUMN     "referenciaPago" TEXT;
