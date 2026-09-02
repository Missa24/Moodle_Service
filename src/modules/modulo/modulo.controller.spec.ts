import { Test, TestingModule } from '@nestjs/testing';
import { ModuloController } from './modulo.controller';
import { ModuloService } from './modulo.service';

describe('ModuloController', () => {
  let controller: ModuloController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModuloController],
      providers: [ModuloService],
    }).compile();

    controller = module.get<ModuloController>(ModuloController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
