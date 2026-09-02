import { Test, TestingModule } from '@nestjs/testing';
import { FormularioLeccionController } from './formulario-leccion.controller';
import { FormularioLeccionService } from './formulario-leccion.service';

describe('FormularioLeccionController', () => {
  let controller: FormularioLeccionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormularioLeccionController],
      providers: [FormularioLeccionService],
    }).compile();

    controller = module.get<FormularioLeccionController>(FormularioLeccionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
