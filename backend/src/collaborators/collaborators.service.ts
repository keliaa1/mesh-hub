import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CollaboratorRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';
import { PermissionService } from 'src/common/permission.service';

@Injectable()
export class CollaboratorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly permissionService: PermissionService,
  ) {}

  async addCollaborator(
    projectId: string,
    dto: AddCollaboratorDto,
    currentUserId: string,
  ) {
    const project = await this.permissionService.getProjectOrFail(projectId);

    this.permissionService.assertCanManageCollaborators(project, currentUserId);

    if (dto.role === CollaboratorRole.OWNER) {
      throw new BadRequestException(
        'A collaborator cannot be assigned the OWNER role',
      );
    }

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.id === project.ownerId) {
      throw new BadRequestException('Owner is already part of the project');
    }

    const exists = await this.prisma.collaborator.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    });

    if (exists) {
      throw new BadRequestException('User is already a collaborator');
    }

    return this.prisma.collaborator.create({
      data: {
        projectId,
        userId: user.id,
        role: dto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(projectId: string, currentUserId: string) {
    const project = await this.permissionService.getProjectOrFail(projectId);

    this.permissionService.assertCanView(project, currentUserId);

    return this.prisma.collaborator.findMany({
      where: {
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        invitedAt: 'asc',
      },
    });
  }

  async updateRole(
    projectId: string,
    collaboratorId: string,
    role: CollaboratorRole,
    currentUserId: string,
  ) {
    const project = await this.permissionService.getProjectOrFail(projectId);
    this.permissionService.assertCanManageCollaborators(project, currentUserId);
    if (role === CollaboratorRole.OWNER) {
      throw new BadRequestException(
        'A collaborator cannot be assigned the OWNER role',
      );
    }

    const collaborator = await this.prisma.collaborator.findUnique({
      where: { id: collaboratorId },
    });

    if (!collaborator || collaborator.projectId !== projectId) {
      throw new NotFoundException('Collaborator not found');
    }

    return this.prisma.collaborator.update({
      where: {
        id: collaboratorId,
      },
      data: {
        role,
      },
    });
  }

  async remove(
    projectId: string,
    collaboratorId: string,
    currentUserId: string,
  ) {
    const project = await this.permissionService.getProjectOrFail(projectId);
    this.permissionService.assertCanManageCollaborators(project, currentUserId);

    const collaborator = await this.prisma.collaborator.findUnique({
      where: { id: collaboratorId },
    });

    if (!collaborator || collaborator.projectId !== projectId) {
      throw new NotFoundException('Collaborator not found');
    }

    await this.prisma.collaborator.delete({
      where: {
        id: collaboratorId,
      },
    });

    return {
      message: 'collaborator deleted successfully',
    };
  }
}
