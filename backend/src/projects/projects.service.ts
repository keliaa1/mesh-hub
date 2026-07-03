import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateProjectDto, ownerId: string) {
        return this.prisma.project.create({
            data: {
                title: dto.title,
                description: dto.description,
                visibility: dto.visibility,
                ownerId,
            },
        });
    }

    async findAll(page: number, limit: number, userId: string) {
        const skip = (page - 1) * limit;

        // Fetch projects AND total count concurrently
        const [items, total] = await Promise.all([
            this.prisma.project.findMany({
                where: {
                    OR: [
                        { visibility: 'PUBLIC' },
                        { ownerId: userId },
                    ]
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.project.count({
                where: {
                    OR: [
                        { visibility: 'PUBLIC' },
                        { ownerId: userId },
                    ]
                },
            }),
        ]);

        return {
            data: items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string, userId: string) {
        const project = await this.prisma.project.findUnique({
            where: { id },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        // If the project is private, ensure the requester is the owner
        if (project.visibility === 'PRIVATE' && project.ownerId !== userId) {
            throw new ForbiddenException('You do not have access to this project');
        }

        return project;
    }

    async update(id: string, dto: UpdateProjectDto, userId: string) {
        const project = await this.prisma.project.findUnique({ where: { id } });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        // Ownership Check
        if (project.ownerId !== userId) {
            throw new ForbiddenException('Only the owner can update this project');
        }

        return this.prisma.project.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string, userId: string) {
        const project = await this.prisma.project.findUnique({ where: { id } });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        // Ownership Check
        if (project.ownerId !== userId) {
            throw new ForbiddenException('Only the owner can delete this project');
        }

        await this.prisma.project.delete({ where: { id } });
        return { message: 'Project successfully deleted' };
    }

    async findById(projectId: string){
        return this.prisma.project.findUnique({
            where:{
                id:projectId,
            },
            include: {
                owner: true,
            }
        })
    }
}
