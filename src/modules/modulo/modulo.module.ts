import { Module } from '@nestjs/common';
import { ModuloService } from './modulo.service';
import { ModuloController } from './modulo.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { PrecioModule } from '../precio/precio.module';

@Module({
  imports: [
    CloudinaryModule,
    PrecioModule,
  ],
  controllers: [ModuloController],
  providers: [ModuloService],
  exports: [ModuloService],
})
export class ModuloModule { }
