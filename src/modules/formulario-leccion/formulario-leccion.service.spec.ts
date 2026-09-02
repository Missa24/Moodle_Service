import { Test, TestingModule } from '@nestjs/testing';
import { FormularioLeccionService } from './formulario-leccion.service';

describe('FormularioLeccionService', () => {
  let service: FormularioLeccionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormularioLeccionService],
    }).compile();

    service = module.get<FormularioLeccionService>(FormularioLeccionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
