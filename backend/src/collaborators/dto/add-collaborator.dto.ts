import { IsEmail, IsEnum } from 'class-validator';
import { CollaboratorRole } from '@prisma/client';

export class AddCollaboratorDto {
  @IsEmail()
  email: string;

  @IsEnum(CollaboratorRole)
  role: CollaboratorRole;
}