import { Test, TestingModule } from '@nestjs/testing';
import { DescuentoService } from './descuento.service';

describe('DescuentoService', () => {
  let service: DescuentoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DescuentoService],
    }).compile();

    service = module.get<DescuentoService>(DescuentoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
