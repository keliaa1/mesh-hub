import {
  Controller,
  UseGuards,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserType } from 'src/auth/types/current-user.type';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';
import { UpdateCollaboratorDto } from './dto/update-role.dto';

@Controller('projects/:projectId/collaborators')
@UseGuards(JwtAuthGuard)
export class CollaboratorsController {
  constructor(private readonly collaboratorsService: CollaboratorsService) {}

  @Post()
  addCollaborator(
    @Param('projectId') projectId: string,
    @Body() dto: AddCollaboratorDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    // BUG FIX: was passing user.id as both userId and currentUserId
    return this.collaboratorsService.addCollaborator(
      projectId,
      dto,
      user.id, // currentUserId — the person making the request
    );
  }

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.collaboratorsService.findAll(projectId, user.id);
  }

  @Patch(':collaboratorId')
  updateRole(
    @Param('projectId') projectId: string,
    @Param('collaboratorId') collaboratorId: string,
    @Body() dto: UpdateCollaboratorDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.collaboratorsService.updateRole(
      projectId,
      collaboratorId,
      dto.role,
      user.id, // FIX: now passes caller's userId for auth check
    );
  }

  @Delete(':collaboratorId')
  remove(
    @Param('projectId') projectId: string,
    @Param('collaboratorId') collaboratorId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.collaboratorsService.remove(
      projectId,
      collaboratorId,
      user.id, // FIX: now passes caller's userId for auth check
    );
  }
}
