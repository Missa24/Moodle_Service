import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import {
  UpdateMiPerfilDto,
  UpdateUsuarioDto,
} from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { Permission } from 'src/common/decorator/decorator';
import { CreateStudentDto } from './dto/create-student.dto';
import {
  CambiarMiPasswordDto,
  ChangePasswordUserDto,
} from './dto/change-password';
import type { AuthenticatedRequest } from 'src/common/types/authenticated-user';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('usuarios.crear')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('crear-estudiante')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('usuarios.crear')
  createStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.userService.createStudent(createStudentDto);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('usuarios.ver')
  buscarUsuarios(@Query('q') q: string) {
    return this.userService.buscarUsuarios(q);
  }

  @Get('estudiantes')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('usuarios.ver')
  obtenerEstudiantes() {
    return this.userService.ObtenerEstudiantes();
  }

  @Get('mi-perfil')
  @UseGuards(JwtAuthGuard)
  obtenerMiPerfil(@Request() req: AuthenticatedRequest) {
    return this.userService.obtenerMiPerfil(req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('usuarios.ver')
  obtenerUsuarios(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.userService.ObtenerTodosPaginado(Number(page), Number(limit),);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('usuarios.ver')
  obtenerUsuarioPorId(@Param('id') id: string) {
    return this.userService.buscarDetallePorId(id);
  }

  @Patch('mi-perfil')
  @UseGuards(JwtAuthGuard)
  actualizarMiPerfil(
    @Request() req: AuthenticatedRequest,
    @Body() data: UpdateMiPerfilDto,
  ) {
    return this.userService.actualizarMiPerfil(req.user.id, data,);
  }

  @Patch('mi-perfil/foto')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  actualizarFotoPerfil(@Request() req: AuthenticatedRequest, @UploadedFile() file?: Express.Multer.File) {
    return this.userService.actualizarFotoPerfil(req.user.id, file,);
  }

  @Patch('mi-password')
  @UseGuards(JwtAuthGuard)
  cambiarMiPassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CambiarMiPasswordDto,
  ) {
    return this.userService.cambiarMiPassword(req.user.id, dto,);
  }

  @Patch('password/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('usuarios.editar')
  async changePasswordUser(
    @Param('id') id: string,
    @Body() dto: ChangePasswordUserDto,
  ) {
    return await this.userService.changePasswordUser(id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('usuarios.editar')
  async actualizarUsuario(
    @Param('id') id: string,
    @Body() data: UpdateUsuarioDto,
  ) {
    return await this.userService.actualizarUsuario(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission('usuarios.eliminar')
  desactivarUsuario(@Param('id') id: string) {
    return this.userService.DesactivarUsuario(id);
  }
}
