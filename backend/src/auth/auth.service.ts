import { Injectable } from '@nestjs/common';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}
  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;
    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }
    const existingUsername = await this.usersService.findByUsername(username);
    if (existingUsername) {
      throw new BadRequestException('Username already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await this.usersService.create({
        username,
        email,
        password: hashedPassword,
      });
      const { password: _, ...safeUser } = user;
      return safeUser;
    } catch (err) {
      // Defensive: covers the race where the pre-check passes but the insert
      // still violates the unique constraints (username or email).
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const target = (err.meta?.target as string[]) ?? [];
        if (target.includes('username')) {
          throw new BadRequestException('Username already exists');
        }
        if (target.includes('email')) {
          throw new BadRequestException('Email already exists');
        }
      }
      throw err;
    }
  }
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }
}
