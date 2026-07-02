import {Body, Controller, Post, UseGuards
} from '@nestjs/common';
import {ProjectsService} from './projects.service';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {CreateProjectDto} from './dto/create-project.dto';
import type { CurrentUserType } from 'src/auth/types/current-user.type';

@Controller('projects')
export class ProjectsController{
    constructor(private readonly projectsService: ProjectsService,){}

    @Post()
    @UseGuards(JwtAuthGuard)
    create(
        @Body() dto: CreateProjectDto,
        @CurrentUser() user: CurrentUserType,
    ){
        return this.projectsService.create(dto, user.id);
    }
}