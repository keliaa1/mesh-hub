import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from '../prisma/prisma.service';
import { PermissionService } from "src/common/permission.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";

@Injectable()
export class CommentsService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly permissionService: PermissionService,
    ) {}

    async createForProject(projectId: string, userId: string, dto: CreateCommentDto) {
        const project = await this.permissionService.getProjectOrFail(projectId);
        
        // Anyone who can view can comment (VIEWER, EDITOR, OWNER)
        // Public projects might need to restrict comments to authenticated users
        // Since we have JwtAuthGuard on the controller, userId is guaranteed to be an authenticated user.
        this.permissionService.assertCanView(project, userId);

        return this.prisma.comment.create({
            data: {
                content: dto.content,
                projectId,
                userId,
            },
            include: {
                user: { select: { id: true, username: true, avatar: true } }
            }
        });
    }

    async createForVersion(versionId: string, userId: string, dto: CreateCommentDto) {
        const version = await this.prisma.version.findUnique({
            where: { id: versionId },
        });

        if (!version) throw new NotFoundException('Version not found');

        const project = await this.permissionService.getProjectOrFail(version.projectId);
        this.permissionService.assertCanView(project, userId);

        return this.prisma.comment.create({
            data: {
                content: dto.content,
                projectId: version.projectId,
                versionId,
                userId,
            },
            include: {
                user: { select: { id: true, username: true, avatar: true } }
            }
        });
    }

    async findByProject(projectId: string, userId: string) {
        const project = await this.permissionService.getProjectOrFail(projectId);
        this.permissionService.assertCanView(project, userId);

        return this.prisma.comment.findMany({
            where: { projectId, versionId: null },
            include: {
                user: { select: { id: true, username: true, avatar: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByVersion(versionId: string, userId: string) {
        const version = await this.prisma.version.findUnique({
            where: { id: versionId },
        });

        if (!version) throw new NotFoundException('Version not found');

        const project = await this.permissionService.getProjectOrFail(version.projectId);
        this.permissionService.assertCanView(project, userId);

        return this.prisma.comment.findMany({
            where: { versionId },
            include: {
                user: { select: { id: true, username: true, avatar: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async update(commentId: string, userId: string, dto: UpdateCommentDto) {
        const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) throw new NotFoundException('Comment not found');

        // Only the comment author can edit it
        if (comment.userId !== userId) {
            throw new ForbiddenException('You can only edit your own comments');
        }

        return this.prisma.comment.update({
            where: { id: commentId },
            data: { content: dto.content },
        });
    }

    async remove(commentId: string, userId: string) {
        const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) throw new NotFoundException('Comment not found');

        const project = await this.permissionService.getProjectOrFail(comment.projectId);
        
        // Comment author or project owner can delete
        if (comment.userId !== userId && project.ownerId !== userId) {
            throw new ForbiddenException('You do not have permission to delete this comment');
        }

        await this.prisma.comment.delete({ where: { id: commentId } });
        return { message: 'Comment deleted successfully' };
    }
}
