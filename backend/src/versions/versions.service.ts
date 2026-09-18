import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateVersionDto } from "./dto/create-version.dto";
import { PermissionService } from "src/common/permission.service";
import * as fs from 'fs/promises';

@Injectable()
export class VersionService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly permissionService: PermissionService,
    ){}

    async create(
        projectId: string,
        dto: CreateVersionDto,
        userId: string,
    ){
        const project = await this.permissionService.getProjectOrFail(projectId);
        
        // EDITOR or OWNER can create versions
        this.permissionService.assertCanEdit(project, userId);

        // Transaction to avoid race condition on versionNumber
        const version = await this.prisma.$transaction(async (tx) => {
            // Lock the project row for update to serialize version creation for this project
            await tx.$queryRaw`SELECT 1 FROM "Project" WHERE id = ${projectId} FOR UPDATE`;

            const latestVersion = await tx.version.findFirst({
                where: {
                    projectId,
                },
                orderBy: {
                    versionNumber:'desc',
                }
            });
            const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
            
            return tx.version.create({
                data:{
                    projectId,
                    versionNumber,
                    commitMessage: dto.commitMessage,
                },
            });
        });

        return version;
    }

    async findAll(projectId: string, userId: string){
        const project = await this.permissionService.getProjectOrFail(projectId);
        
        // Public/Unlisted projects can be viewed by anyone. Private needs auth.
        // Even for public, maybe we want to allow guests, but this controller uses JwtAuthGuard for now, 
        // wait, we can just allow it if permissionService.canView is true.
        this.permissionService.assertCanView(project, userId);

        return this.prisma.version.findMany({
            where: {
                projectId,
            },
            orderBy: {
                versionNumber: 'desc',
            },
            include: {
                files: true,
            }
        });
    }

    async findOne(id: string, userId: string){
        const version = await this.prisma.version.findUnique({
            where: {
                id,
            },
            include: {
                files: true,
            },
        });

        if (!version){
            throw new NotFoundException('Version not found',);
        }

        const project = await this.permissionService.getProjectOrFail(version.projectId);
        this.permissionService.assertCanView(project, userId);

        return version;
    }

    async remove(
        id:string,
        userId:string,
    ){
        const version = await this.prisma.version.findUnique({
            where:{
                id,
            },
            include: {
                files: true,
            }
        });

        if (!version){
            throw new NotFoundException('Version not found',);
        }

        const project = await this.permissionService.getProjectOrFail(version.projectId);
        // Only OWNER or EDITOR can delete versions. Plan said OWNER only for project deletion, 
        // but can EDITOR delete a version? Let's restrict it to OWNER and EDITOR.
        this.permissionService.assertCanEdit(project, userId);

        // Cascade delete files from disk
        for (const file of version.files) {
            try {
                await fs.unlink(file.path);
            } catch (e) {
                console.error(`Failed to delete file on disk: ${file.path}`);
            }
        }

        await this.prisma.version.delete({
            where:{
                id,
            },
        });

        return {
            message: 'version deleted successfully',
        };
    }
}