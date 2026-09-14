import { Test, TestingModule } from '@nestjs/testing';
import { DescuentoController } from './descuento.controller';
import { DescuentoService } from './descuento.service';

describe('DescuentoController', () => {
  let controller: DescuentoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DescuentoController],
      providers: [DescuentoService],
    }).compile();

    controller = module.get<DescuentoController>(DescuentoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
