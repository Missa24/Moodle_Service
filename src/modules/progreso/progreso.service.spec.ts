import { Test, TestingModule } from '@nestjs/testing';
import { ProgresoService } from './progreso.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CertificadoService } from '../certificado/certificado.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

describe('ProgresoService', () => {
  let service: ProgresoService;
  let prisma: {
    inscripcion: {
      findUnique: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    leccion: { count: jest.Mock };
    progresoLeccion: { count: jest.Mock };
    progresoModulo: { findUnique: jest.Mock; upsert: jest.Mock };
    modulo: { count: jest.Mock };
    reglaCertificacionCurso: { findUnique: jest.Mock };
    progresoCurso: { upsert: jest.Mock };
  };
  let certificadoService: {
    emitirCertificadoModulo: jest.Mock;
    verificarYEmitirCertificadoCurso: jest.Mock;
  };
  let notificacionesService: { crearUnica: jest.Mock };

  const inscripcionModuloA = {
    id: 'ins-1',
    estudianteId: 'user-1',
    moduloId: 'mod-1',
    modulo: {
      id: 'mod-1',
      nombre: 'Módulo A',
      cursoId: 'curso-1',
      curso: { id: 'curso-1', nombre: 'Curso A' },
    },
  };

  const progresoModuloCompletado = {
    id: 'pm-1',
    inscripcionId: 'ins-1',
    estado: 'completado',
    porcentaje: 100,
    leccionesTotales: 2,
    leccionesCompletadas: 2,
    completadoEn: new Date(),
    actualizadoEn: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      inscripcion: {
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      leccion: { count: jest.fn() },
      progresoLeccion: { count: jest.fn() },
      progresoModulo: { findUnique: jest.fn(), upsert: jest.fn() },
      modulo: { count: jest.fn() },
      reglaCertificacionCurso: { findUnique: jest.fn() },
      progresoCurso: { upsert: jest.fn() },
    };

    certificadoService = {
      emitirCertificadoModulo: jest.fn(),
      verificarYEmitirCertificadoCurso: jest.fn(),
    };

    notificacionesService = { crearUnica: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgresoService,
        { provide: PrismaService, useValue: prisma },
        { provide: CertificadoService, useValue: certificadoService },
        { provide: NotificacionesService, useValue: notificacionesService },
      ],
    }).compile();

    service = module.get<ProgresoService>(ProgresoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recalcularProgresoModulo', () => {
    beforeEach(() => {
      prisma.inscripcion.findUnique.mockResolvedValue(inscripcionModuloA);
      prisma.leccion.count.mockResolvedValue(2);
      prisma.progresoLeccion.count.mockResolvedValue(2);
      prisma.progresoModulo.upsert.mockResolvedValue(progresoModuloCompletado);
      prisma.inscripcion.update.mockResolvedValue({});
      prisma.modulo.count.mockResolvedValue(1);
      prisma.inscripcion.count.mockResolvedValue(1);
      prisma.reglaCertificacionCurso.findUnique.mockResolvedValue({
        porcentajeModulosRequerido: 100,
      });
      prisma.progresoCurso.upsert.mockResolvedValue({});
      certificadoService.emitirCertificadoModulo.mockResolvedValue({});
      certificadoService.verificarYEmitirCertificadoCurso.mockResolvedValue({});
      notificacionesService.crearUnica.mockResolvedValue({});
    });

    it('crea certificado y notificaciones la primera vez que el módulo se completa', async () => {
      prisma.progresoModulo.findUnique.mockResolvedValue(null);

      await service.recalcularProgresoModulo('ins-1');

      expect(certificadoService.emitirCertificadoModulo).toHaveBeenCalledWith(
        'ins-1',
      );
      expect(notificacionesService.crearUnica).toHaveBeenCalledTimes(2);
      expect(notificacionesService.crearUnica).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'modulo_completado' }),
      );
      expect(notificacionesService.crearUnica).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'curso_completado' }),
      );
    });

    it('no crea certificado ni notificación si el módulo ya estaba completado', async () => {
      prisma.progresoModulo.findUnique.mockResolvedValue(
        progresoModuloCompletado,
      );

      await service.recalcularProgresoModulo('ins-1');

      expect(certificadoService.emitirCertificadoModulo).not.toHaveBeenCalled();
      expect(notificacionesService.crearUnica).not.toHaveBeenCalled();
      expect(prisma.modulo.count).not.toHaveBeenCalled();
    });

    it('no crea notificación si el módulo sigue en progreso', async () => {
      prisma.progresoLeccion.count.mockResolvedValue(1);
      prisma.progresoModulo.findUnique.mockResolvedValue(null);
      prisma.progresoModulo.upsert.mockResolvedValue({
        ...progresoModuloCompletado,
        estado: 'en_progreso',
        porcentaje: 50,
        leccionesCompletadas: 1,
        completadoEn: null,
      });

      await service.recalcularProgresoModulo('ins-1');

      expect(notificacionesService.crearUnica).not.toHaveBeenCalled();
      expect(certificadoService.emitirCertificadoModulo).not.toHaveBeenCalled();
    });
  });
});