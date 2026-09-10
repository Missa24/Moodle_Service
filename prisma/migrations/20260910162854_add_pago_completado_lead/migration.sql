/*
  Warnings:

  - The values [PAGO_INICIADO] on the enum `EstadoLead` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoLead_new" AS ENUM ('INTERESADO', 'PAGO_COMPLETADO', 'CONVERTIDO', 'DESCARTADO');
ALTER TABLE "public"."leads" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "leads" ALTER COLUMN "estado" TYPE "EstadoLead_new" USING ("estado"::text::"EstadoLead_new");
ALTER TYPE "EstadoLead" RENAME TO "EstadoLead_old";
ALTER TYPE "EstadoLead_new" RENAME TO "EstadoLead";
DROP TYPE "public"."EstadoLead_old";
ALTER TABLE "leads" ALTER COLUMN "estado" SET DEFAULT 'INTERESADO';
COMMIT;
