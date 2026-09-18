import { Controller, Get, Patch, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserType } from '../auth/types/current-user.type';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: CurrentUserType) {
    return user;
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/password')
  async changePassword(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: ChangePasswordDto,
  ) {
    const fullUser = await this.usersService.findById(user.id);
    if (!fullUser) throw new UnauthorizedException('User not found');

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, fullUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.changePassword(user.id, hashedNewPassword);

    return { message: 'Password updated successfully' };
  }
}
