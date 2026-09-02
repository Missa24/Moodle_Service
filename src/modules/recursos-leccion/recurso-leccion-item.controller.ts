import {
    Controller,
    Get,
    Patch,
    Param,
    Delete,
    Body,
    UseGuards,
} from '@nestjs/common';
import { RecursoLeccionService } from './recursos-leccion.service';
import { UpdateRecursoLeccionDto } from './dto/update-recursos-leccion.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { Permission } from 'src/common/decorator/decorator';

@Controller('recursos-leccion')
export class RecursoLeccionItemController {
    constructor(private readonly recursoService: RecursoLeccionService) { }

    @Get(':id')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @Permission('recursos_lecciones.ver')
    findOne(@Param('id') id: string) {
        return this.recursoService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @Permission('recursos_lecciones.editar')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateRecursoLeccionDto,
    ) {
        return this.recursoService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @Permission('recursos_lecciones.eliminar')
    remove(@Param('id') id: string) {
        return this.recursoService.remove(id);
    }
}
