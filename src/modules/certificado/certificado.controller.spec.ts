import { Test, TestingModule } from '@nestjs/testing';
import { CertificadosController } from './certificado.controller';
import { CertificadoService } from './certificado.service';

describe('CertificadosController', () => {
  let controller: CertificadosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CertificadosController],
      providers: [CertificadoService],
    }).compile();

    controller = module.get<CertificadosController>(
      CertificadosController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

