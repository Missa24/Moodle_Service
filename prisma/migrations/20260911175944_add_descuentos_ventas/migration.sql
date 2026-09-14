-- CreateEnum
CREATE TYPE "TipoDescuento" AS ENUM ('PORCENTAJE', 'MONTO_FIJO');

-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('BOLIVIA', 'PAYPAL');

-- AlterTable
ALTER TABLE "precios" ADD COLUMN     "urlPagoBolivia" TEXT;

-- CreateTable
CREATE TABLE "descuentos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoDescuento" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "iniciaEn" TIMESTAMP(3) NOT NULL,
    "finalizaEn" TIMESTAMP(3) NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "descuentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descuento_modulos" (
    "descuentoId" TEXT NOT NULL,
    "moduloId" TEXT NOT NULL,

    CONSTRAINT "descuento_modulos_pkey" PRIMARY KEY ("descuentoId","moduloId")
);

-- CreateTable
CREATE TABLE "ventas_modulos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "moduloId" TEXT NOT NULL,
    "leadId" TEXT,
    "inscripcionId" TEXT,
    "descuentoId" TEXT,
    "precioBase" DECIMAL(10,2) NOT NULL,
    "descuentoNombre" TEXT,
    "descuentoTipo" "TipoDescuento",
    "descuentoValor" DECIMAL(10,2),
    "montoDescuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalPagado" DECIMAL(10,2) NOT NULL,
    "medioPago" "MedioPago" NOT NULL,
    "paisCodigo" CHAR(2),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_modulos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "descuentos_habilitado_iniciaEn_finalizaEn_idx" ON "descuentos"("habilitado", "iniciaEn", "finalizaEn");

-- CreateIndex
CREATE INDEX "descuento_modulos_moduloId_idx" ON "descuento_modulos"("moduloId");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_modulos_leadId_key" ON "ventas_modulos"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_modulos_inscripcionId_key" ON "ventas_modulos"("inscripcionId");

-- CreateIndex
CREATE INDEX "ventas_modulos_usuarioId_idx" ON "ventas_modulos"("usuarioId");

-- CreateIndex
CREATE INDEX "ventas_modulos_moduloId_idx" ON "ventas_modulos"("moduloId");

-- CreateIndex
CREATE INDEX "ventas_modulos_descuentoId_idx" ON "ventas_modulos"("descuentoId");

-- CreateIndex
CREATE INDEX "ventas_modulos_creadoEn_idx" ON "ventas_modulos"("creadoEn");

-- AddForeignKey
ALTER TABLE "descuento_modulos" ADD CONSTRAINT "descuento_modulos_descuentoId_fkey" FOREIGN KEY ("descuentoId") REFERENCES "descuentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento_modulos" ADD CONSTRAINT "descuento_modulos_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "modulos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_modulos" ADD CONSTRAINT "ventas_modulos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_modulos" ADD CONSTRAINT "ventas_modulos_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "modulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_modulos" ADD CONSTRAINT "ventas_modulos_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_modulos" ADD CONSTRAINT "ventas_modulos_inscripcionId_fkey" FOREIGN KEY ("inscripcionId") REFERENCES "inscripciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_modulos" ADD CONSTRAINT "ventas_modulos_descuentoId_fkey" FOREIGN KEY ("descuentoId") REFERENCES "descuentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
