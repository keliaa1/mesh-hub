import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async create(data: {
    username: string;
    email: string;
    password: string;
  }) {
    return this.prisma.user.create({
      data,
    });
  }

  async updateProfile(id: string, data: { username?: string; avatar?: string }) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async changePassword(id: string, newPasswordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: { password: newPasswordHash },
    });
  }
}