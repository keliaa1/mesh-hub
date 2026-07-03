import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import { VersionService } from "./versions.service";
import { Controller, UseGuards, Post, Body, Param, Delete, Get } from "@nestjs/common";
import type { CurrentUserType } from "src/auth/types/current-user.type";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CreateVersionDto } from "./dto/create-version.dto";
@Controller('projects/:projectId/versions')
export class VersionsController{
    constructor (
        private readonly versionService: VersionService,
    ){}

    @Post()
    @UseGuards(JwtAuthGuard)
    create(
        @Param('projectId') projectId: string,
        @Body() dto: CreateVersionDto,
        @CurrentUser() user: CurrentUserType,
    ){
        return this.versionService.create(
            projectId,
            dto,
            user.id,
        );
    }
    @Get()
    findAll(
        @Param('projectId') projectId: string,
    ){
        return this.versionService.findAll(projectId);
    }

    @Get(':id')
    findOne(
        @Param('id') id:string,
    ){
        return this.versionService.findOne(id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(
        @Param('id') id:string,
        @CurrentUser() user:CurrentUserType,
    ){
        return this.versionService.remove(
            id,
            user.id
        );
    }
}