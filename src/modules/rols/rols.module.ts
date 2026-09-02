import { Module } from '@nestjs/common';
import { RolsService } from './rols.service';
import { RolsController } from './rols.controller';

@Module({
  controllers: [RolsController],
  providers: [RolsService],
})
export class RolsModule {
}

