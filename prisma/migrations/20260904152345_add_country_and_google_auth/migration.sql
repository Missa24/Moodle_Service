-- CreateEnum
CREATE TYPE "ProveedorOAuth" AS ENUM ('GOOGLE');

-- AlterTable
ALTER TABLE "perfiles" ADD COLUMN     "paisCodigo" CHAR(2);

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "contrasenaHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "cuentas_oauth" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "proveedor" "ProveedorOAuth" NOT NULL,
    "proveedorUsuarioId" TEXT NOT NULL,
    "correoProveedor" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_oauth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cuentas_oauth_usuarioId_idx" ON "cuentas_oauth"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_oauth_proveedor_proveedorUsuarioId_key" ON "cuentas_oauth"("proveedor", "proveedorUsuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_oauth_usuarioId_proveedor_key" ON "cuentas_oauth"("usuarioId", "proveedor");

-- AddForeignKey
ALTER TABLE "cuentas_oauth" ADD CONSTRAINT "cuentas_oauth_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
