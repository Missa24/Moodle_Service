import { Test, TestingModule } from '@nestjs/testing';
import { NotificacionesService } from './notificaciones.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('NotificacionesService', () => {
  let service: NotificacionesService;
  let prisma: {
    notificaciones: {
      create: jest.Mock;
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      notificaciones: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificacionesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NotificacionesService>(NotificacionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('crearUnica', () => {
    const datos = {
      usuarioId: 'user-1',
      tipo: 'modulo_completado',
      titulo: '¡Felicidades! Has completado el módulo "Módulo A"',
      contenido: 'Contenido de la notificación',
      urlAccion: '/certificados',
    };

    it('no crea una nueva notificación si ya existe una con el mismo usuario, tipo y título', async () => {
      const existente = { id: 'notif-1', ...datos };
      prisma.notificaciones.findFirst.mockResolvedValue(existente);

      const resultado = await service.crearUnica(datos);

      expect(prisma.notificaciones.findFirst).toHaveBeenCalledWith({
        where: {
          usuarioId: datos.usuarioId,
          tipo: datos.tipo,
          titulo: datos.titulo,
        },
      });
      expect(prisma.notificaciones.create).not.toHaveBeenCalled();
      expect(resultado).toEqual(existente);
    });

    it('crea la notificación si no existe previamente', async () => {
      prisma.notificaciones.findFirst.mockResolvedValue(null);
      const creada = { id: 'notif-2', ...datos };
      prisma.notificaciones.create.mockResolvedValue(creada);

      const resultado = await service.crearUnica(datos);

      expect(prisma.notificaciones.create).toHaveBeenCalledWith({
        data: {
          usuarioId: datos.usuarioId,
          tipo: datos.tipo,
          titulo: datos.titulo,
          contenido: datos.contenido,
          urlAccion: datos.urlAccion,
        },
      });
      expect(resultado).toEqual(creada);
    });
  });
});