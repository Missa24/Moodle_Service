import { Test, TestingModule } from '@nestjs/testing';
import { RecursoLeccionService } from './recursos-leccion.service';

describe('RecursoLeccionService', () => {
  let service: RecursoLeccionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecursoLeccionService],
    }).compile();

    service = module.get<RecursoLeccionService>(
      RecursoLeccionService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});