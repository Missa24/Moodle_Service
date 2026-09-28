-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "comprobantePagoNombre" TEXT,
ADD COLUMN     "comprobantePagoPublicId" TEXT,
ADD COLUMN     "comprobantePagoSubidoEn" TIMESTAMP(3),
ADD COLUMN     "comprobantePagoUrl" TEXT,
ADD COLUMN     "referenciaPago" TEXT;

-- AlterTable
ALTER TABLE "ventas_cursos" ADD COLUMN     "comprobantePagoNombre" TEXT,
ADD COLUMN     "comprobantePagoPublicId" TEXT,
ADD COLUMN     "comprobantePagoUrl" TEXT;

-- AlterTable
ALTER TABLE "ventas_modulos" ADD COLUMN     "comprobantePagoNombre" TEXT,
ADD COLUMN     "comprobantePagoPublicId" TEXT,
ADD COLUMN     "comprobantePagoUrl" TEXT;
