import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import type { CurrentUserType } from "src/auth/types/current-user.type";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Post('projects/:projectId/comments')
    createForProject(
        @Param('projectId') projectId: string,
        @Body() dto: CreateCommentDto,
        @CurrentUser() user: CurrentUserType,
    ) {
        return this.commentsService.createForProject(projectId, user.id, dto);
    }

    @Post('versions/:versionId/comments')
    createForVersion(
        @Param('versionId') versionId: string,
        @Body() dto: CreateCommentDto,
        @CurrentUser() user: CurrentUserType,
    ) {
        return this.commentsService.createForVersion(versionId, user.id, dto);
    }

    @Get('projects/:projectId/comments')
    findByProject(
        @Param('projectId') projectId: string,
        @CurrentUser() user: CurrentUserType,
    ) {
        return this.commentsService.findByProject(projectId, user.id);
    }

    @Get('versions/:versionId/comments')
    findByVersion(
        @Param('versionId') versionId: string,
        @CurrentUser() user: CurrentUserType,
    ) {
        return this.commentsService.findByVersion(versionId, user.id);
    }

    @Patch('comments/:commentId')
    update(
        @Param('commentId') commentId: string,
        @Body() dto: UpdateCommentDto,
        @CurrentUser() user: CurrentUserType,
    ) {
        return this.commentsService.update(commentId, user.id, dto);
    }

    @Delete('comments/:commentId')
    remove(
        @Param('commentId') commentId: string,
        @CurrentUser() user: CurrentUserType,
    ) {
        return this.commentsService.remove(commentId, user.id);
    }
}
