import {
    Body, Controller, Post, Get, Patch, Delete,
    Param, Query, UseGuards, DefaultValuePipe, ParseIntPipe
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type { CurrentUserType } from 'src/auth/types/current-user.type';

@Controller('projects')
@UseGuards(JwtAuthGuard) 
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) {}

    @Post()
    create(
        @Body() dto: CreateProjectDto,
        @CurrentUser() user: CurrentUserType,
    ) {
        return this.projectsService.create(dto, user.id);
    }

    @Get()
    findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @CurrentUser() user: CurrentUserType,
    ) {
        return this.projectsService.findAll(page, limit, user.id);
    }

    @Get(':id')
    findOne(
        @Param('id') id: string,
        @CurrentUser() user: CurrentUserType,
    ) {
        return this.projectsService.findOne(id, user.id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateProjectDto,
        @CurrentUser() user: CurrentUserType,
    ) {
        return this.projectsService.update(id, dto, user.id);
    }

    @Delete(':id')
    remove(
        @Param('id') id: string,
        @CurrentUser() user: CurrentUserType,
    ) {
        return this.projectsService.remove(id, user.id);
    }
}
