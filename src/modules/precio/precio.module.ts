import { Module } from '@nestjs/common';
import { PrecioService } from './precio.service';

@Module({
  providers: [PrecioService],
  exports: [PrecioService],
})
export class PrecioModule {}
