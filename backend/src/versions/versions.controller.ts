import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import { VersionService } from "./versions.service";
import { Controller, UseGuards, Post, Body, Param, Delete, Get } from "@nestjs/common";
import type { CurrentUserType } from "src/auth/types/current-user.type";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CreateVersionDto } from "./dto/create-version.dto";

@Controller('projects/:projectId/versions')
@UseGuards(JwtAuthGuard) // Require auth for everything, later we might want public access
export class VersionsController{
    constructor (
        private readonly versionService: VersionService,
    ){}

    @Post()
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
    
    // NOTE: version history listing is served by
    // GET /projects/:id/versions in ProjectsController
    // (richer payload, matches the Blender add-on contract).
    // A duplicate `@Get()` here previously collided with that
    // route on the same path shape and has been removed.

    @Get(':id')
    findOne(
        @Param('id') id:string,
        @CurrentUser() user: CurrentUserType,
    ){
        return this.versionService.findOne(id, user.id);
    }

    @Delete(':id')
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