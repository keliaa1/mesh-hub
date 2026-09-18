import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';

import { ProjectsService } from './projects.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { CreateProjectDto } from './dto/create-project.dto';

import { UpdateProjectDto } from './dto/update-project.dto';

import type { CurrentUserType } from 'src/auth/types/current-user.type';

import { FileInterceptor } from '@nestjs/platform-express';

import type { Response } from 'express';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ========================================================
  // CREATE
  // ========================================================

  @Post()
  create(
    @Body()
    dto: CreateProjectDto,

    @CurrentUser()
    user: CurrentUserType,
  ) {
    return this.projectsService.create(
      dto,

      user.id,
    );
  }

  // ========================================================
  // FIND ALL
  // ========================================================

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,

    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,

    @Query('search')
    search: string,

    @Query('sort')
    sort: string,

    @Query('order')
    order: 'asc' | 'desc',

    @CurrentUser()
    user: CurrentUserType,
  ) {
    return this.projectsService.findAll(
      page,

      limit,

      user.id,

      search,

      sort,

      order,
    );
  }

  // ========================================================
  // CURRENT FILE DOWNLOAD
  // ========================================================

  @Get(':id/download')
  async download(
    @Param('id')
    projectId: string,

    @CurrentUser()
    user: CurrentUserType,

    @Res()
    res: Response,
  ) {
    return this.projectsService.downloadCurrent(
      projectId,

      user.id,

      res,
    );
  }

  // ========================================================
  // VERSION HISTORY
  // ========================================================

  @Get(':id/versions')
  getVersionHistory(
    @Param('id')
    projectId: string,

    @CurrentUser()
    user: CurrentUserType,
  ) {
    return this.projectsService.getVersionHistory(
      projectId,

      user.id,
    );
  }

  // ========================================================
  // DOWNLOAD SPECIFIC VERSION
  // ========================================================

  @Get(':id/versions/:versionNumber/download')
  async downloadVersion(
    @Param('id')
    projectId: string,

    @Param('versionNumber', ParseIntPipe)
    versionNumber: number,

    @CurrentUser()
    user: CurrentUserType,

    @Res()
    res: Response,
  ) {
    return this.projectsService.downloadVersion(
      projectId,

      versionNumber,

      user.id,

      res,
    );
  }

  // ========================================================
  // RESTORE VERSION
  // ========================================================

  @Post(':id/versions/:versionNumber/restore')
  restoreVersion(
    @Param('id')
    projectId: string,

    @Param('versionNumber', ParseIntPipe)
    versionNumber: number,

    @CurrentUser()
    user: CurrentUserType,
  ) {
    return this.projectsService.restoreVersion(
      projectId,

      versionNumber,

      user.id,
    );
  }

  // ========================================================
  // FIND ONE
  // ========================================================

  @Get(':id')
  findOne(
    @Param('id')
    id: string,

    @CurrentUser()
    user: CurrentUserType,
  ) {
    return this.projectsService.findOne(
      id,

      user.id,
    );
  }

  // ========================================================
  // UPDATE
  // ========================================================

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateProjectDto,

    @CurrentUser()
    user: CurrentUserType,
  ) {
    return this.projectsService.update(
      id,

      dto,

      user.id,
    );
  }

  // ========================================================
  // DELETE
  // ========================================================

  @Delete(':id')
  remove(
    @Param('id')
    id: string,

    @CurrentUser()
    user: CurrentUserType,
  ) {
    return this.projectsService.remove(
      id,

      user.id,
    );
  }

  // ========================================================
  // PUSH
  // ========================================================

  @Post(':id/push')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
    }),
  )
  push(
    @Param('id')
    projectId: string,

    @UploadedFile()
    file: Express.Multer.File,

    @CurrentUser()
    user: CurrentUserType,

    @Body('commitMessage')
    commitMessage?: string,
  ) {
    return this.projectsService.push(
      projectId,

      file,

      user.id,

      commitMessage,
    );
  }
}
