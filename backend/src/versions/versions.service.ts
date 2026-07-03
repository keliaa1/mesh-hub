import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ProjectsService } from "src/projects/projects.service";
import { CreateVersionDto } from "./dto/create-version.dto";
import { NotFoundException } from "@nestjs/common/exceptions";
import { ForbiddenException } from "@nestjs/common/exceptions";

@Injectable()
export class VersionService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly projectsService: ProjectsService,
    ){}

    async create(
        projectId: string,
        dto: CreateVersionDto,
        userId: string,
    ){
        const project =  await this.projectsService.findById(projectId);
        if (!project){
            throw new NotFoundException('Project not found');
        }
        if (project.ownerId !== userId){
            throw new ForbiddenException('You cannot create versions for this project',)
        }
        const latestVersion =  await this.prisma.version.findFirst({
            where: {
                projectId,
            },
            orderBy: {
                versionNumber:'desc',
            }
        });
        const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
        const version = await this.prisma.version.create({
            data:{
                projectId,
                versionNumber,
                commitMessage: dto.commitMessage,
            },
        });
        return version;
    }
    async findAll(projectId: string){
        return this.prisma.version.findMany({
            where: {
                projectId,
            },
            orderBy: {
                versionNumber: 'desc',
            },
        });
    }
    async findOne(id: string){
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
                project:true,
            },
        });

        if (!version){
            throw new NotFoundException('Version not found',);
        }
        if (version.project.ownerId !== userId){
            throw  new ForbiddenException('Not allowed',);
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