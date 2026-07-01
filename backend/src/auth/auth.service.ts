import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterDto} from './dto/register.dto'
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()

export class AuthService{
    constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService){}
    async register(registerDto: RegisterDto){
        const {username, email, password} = registerDto;
        const existingUser = await this.prisma.user.findUnique({
            where:{
                email,
            },
        });
        if(existingUser){
            throw new BadRequestException('Email already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
            data:{
                username,
                email,
                password: hashedPassword,

            },

        });
        const { password:_, ...safeUser} = user;
        return safeUser;

    }
    async login(loginDto: LoginDto){
        const {email, password} = loginDto;
        const user = await this.prisma.user.findUnique({
            where:{email},
        });
        if (!user){
            throw new UnauthorizedException('Invalid credentials');

        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = {sub: user.id, email: user.email, username:user.username};

        return{
            access_token: await
            this.jwtService.signAsync(payload),
            user:{
                id: user.id,
                email: user.email,
                username:user.username
            }
        };
    }
}
