import { Test, TestingModule } from '@nestjs/testing';
import { RecursoLeccionController } from './recursos-leccion.controller';
import { RecursoLeccionService } from './recursos-leccion.service';

describe('RecursoLeccionController', () => {
  let controller: RecursoLeccionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecursoLeccionController],
      providers: [RecursoLeccionService],
    }).compile();

    controller = module.get<RecursoLeccionController>(
      RecursoLeccionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});