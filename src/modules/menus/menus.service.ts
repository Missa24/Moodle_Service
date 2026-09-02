import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MenusService {
    constructor(private readonly prisma: PrismaService) { }

    async obtenerMenusPorRoles(rolIds: string[]) {
        return await this.prisma.menu.findMany({
            where: {
                estado: 'activo',
                roles: {
                    some: {
                        rolId: {
                            in: rolIds,
                        },
                    },
                },
            },
            orderBy: {
                orden: 'asc',
            },
        });
    }
}