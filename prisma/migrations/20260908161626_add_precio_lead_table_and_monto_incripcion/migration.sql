-- AlterTable
ALTER TABLE "inscripciones" ADD COLUMN     "monto" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "precios" (
    "id" TEXT NOT NULL,
    "moduloId" TEXT NOT NULL,
    "costo" DECIMAL(10,2) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "precios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "moduloId" TEXT NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "precios_moduloId_creadoEn_idx" ON "precios"("moduloId", "creadoEn");

-- CreateIndex
CREATE INDEX "leads_usuarioId_idx" ON "leads"("usuarioId");

-- CreateIndex
CREATE INDEX "leads_moduloId_idx" ON "leads"("moduloId");

-- AddForeignKey
ALTER TABLE "precios" ADD CONSTRAINT "precios_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "modulos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "modulos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
