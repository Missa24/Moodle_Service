import { Test, TestingModule } from '@nestjs/testing';
import { LeccionController } from './leccion.controller';
import { LeccionService } from './leccion.service';

describe('LeccionController', () => {
  let controller: LeccionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeccionController],
      providers: [LeccionService],
    }).compile();

    controller = module.get<LeccionController>(LeccionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
