import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterDto} from './dto/register.dto'

@Injectable()

export class AuthService{
    constructor(private readonly prisma: PrismaService){}
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
}
