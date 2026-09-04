import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change.dto';
import type { AuthenticatedUser } from 'src/common/types/authenticated-user';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    logout() {
        return this.authService.logout();
    }

    @Public()
    @Post("google")
    google(
        @Body()
        dto: GoogleAuthDto,
    ) {
        return this.authService.google(
            dto.credential,
        );
    }

    @Public()
    @Post("register")
    register(
        @Body() dto: RegisterDto
    ) {
        return this.authService.register(
            dto
        );
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto,) {
        return this.authService.changePassword(user.id, dto.password);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    obtenerPerfil(@CurrentUser() user: AuthenticatedUser) {
        return this.authService.getProfile(user.id);
    }
}
