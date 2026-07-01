import {Body, Controller, HttpCode, HttpStatus, Post} from '@nestjs/common';
import {AuthService} from './auth.service';
import {RegisterDto} from './dto/register.dto';
import {LoginDto} from './dto/login.dto';

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
}