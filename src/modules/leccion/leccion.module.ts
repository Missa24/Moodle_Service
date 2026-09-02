import { Module } from "@nestjs/common";
import { LeccionService } from "./leccion.service";
import { LeccionController } from "./leccion.controller";
import { RecursoLeccionService } from "src/modules/recursos-leccion/recursos-leccion.service";
import { RecursoLeccionController } from "src/modules/recursos-leccion/recursos-leccion.controller";
import { RecursoLeccionItemController } from "src/modules/recursos-leccion/recurso-leccion-item.controller";
import { ProgresoModule } from "src/modules/progreso/progreso.module";
import { CloudinaryModule } from "src/cloudinary/cloudinary.module";
import { RecursosLeccionModule } from "src/modules/recursos-leccion/recursos-leccion.module";
import { CertificadosModule } from "src/modules/certificado/certificado.module";

@Module({
  imports: [CloudinaryModule, RecursosLeccionModule, ProgresoModule, CertificadosModule],
  controllers: [LeccionController, RecursoLeccionController, RecursoLeccionItemController],
  providers: [LeccionService, RecursoLeccionService],
})
export class LeccionModule { }