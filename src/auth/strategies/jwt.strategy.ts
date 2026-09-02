import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../modules/user/user.service';

interface JwtPayload {
    sub: string;
    username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly userService: UserService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET!,
        });
    }

    async validate(payload: JwtPayload) {
        const usuario = await this.userService.buscarPorId(payload.sub);

        if (
            !usuario ||
            (usuario.estado !== 'activo' &&
                usuario.estado !== 'pendiente')
        ) {
            throw new UnauthorizedException(
                'Usuario no válido',
            );
        }

        const roles = usuario.roles.map(
            (item) => item.rol.nombre,
        );

        const permisos = usuario.roles.flatMap(
            (item) =>
                item.rol.permisos.map(
                    (rolPermiso) =>
                        rolPermiso.permiso.nombre,
                ),
        );

        return {
            id: usuario.id,
            username: usuario.username,
            correo: usuario.correo,
            roles,
            permisos,
        };
    }
}