import {Body, Controller, HttpCode, HttpStatus, Post} from '@nestjs/common';
import {AuthService} from './auth.service';
import {RegisterDto} from './dto/register.dto';
import {LoginDto} from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {Get, UseGuards} from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import type { CurrentUserType } from './types/current-user.type';

@Controller('auth')
export class AuthController{
    constructor(private readonly authservice: AuthService){}

    @Post('register')
    register(@Body() registerDto: RegisterDto){
        return this.authservice.register(registerDto);
    }
    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() loginDto: LoginDto){
        return this.authservice.login(loginDto);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
profile(@CurrentUser() user: CurrentUserType) {
  return {
    message: 'You are authenticated!',
  };
}
}