import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../modules/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { MenusService } from 'src/modules/menus/menus.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly menusService: MenusService
    ) { }

    async login(loginDto: LoginDto) {
        const { correo, password } = loginDto;
        const usuario = await this.userService.buscarPorCorreo(correo);
        if (
            !usuario ||
            (usuario.estado !== "activo" && usuario.estado !== "pendiente")
        ) {
            throw new UnauthorizedException("Credenciales Incorrectas");
        }
        const passwordValido = await bcrypt.compare(password, usuario.contrasenaHash);
        if (!passwordValido) {
            throw new UnauthorizedException("Credenciales Incorrectas");
        }
        const nombresRoles = usuario.roles.map((item) => item.rol.nombre);

        const permisos = usuario.roles.flatMap((item) =>
            item.rol.permisos.map((rolPermiso) => rolPermiso.permiso.nombre),
        );

        const rolIds = usuario.roles.map((item) => item.rolId);

        const menus = await this.menusService.obtenerMenusPorRoles(rolIds);


        const payload = {
            sub: usuario.id,
            username: usuario.username
        }

        return {
            access_token: await this.jwtService.signAsync(payload, { expiresIn: '1h' }),
            usuario: {
                id: usuario.id,
                username: usuario.username,
                correo: usuario.correo,
                estado: usuario.estado,
                rol: nombresRoles,
                permisos,
                menus,
            }
        }
    }
    logout() {
        return {
            success: true,
            message: 'Sesión cerrada correctamente',
        };
    }

    async changePassword(userId: string, newPassword: string) {
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.userService.actualizarPassword(userId, passwordHash);

        return {
            success: true,
            message: 'Contraseña cambiada correctamente',
        };
    }
    async getProfile(userId: string) {
        const usuario = await this.userService.buscarPorId(userId);

        if (!usuario) {
            throw new UnauthorizedException(
                'Usuario no encontrado',
            );
        }

        return {
            id: usuario.id,
            username: usuario.username,
            correo: usuario.correo,
            estado: usuario.estado,
            perfil: usuario.perfil,
        };
    }
}
