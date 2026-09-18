import { IsEnum } from 'class-validator';
import { CollaboratorRole } from '@prisma/client';

export class UpdateCollaboratorDto {
  @IsEnum(CollaboratorRole)
  role: CollaboratorRole;
}