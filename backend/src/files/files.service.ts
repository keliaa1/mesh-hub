import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import {PrismaService} from'../prisma/prisma.service';
import {VersionService} from '../versions/versions.service';

@Injectable()
export class FilesService{
    constructor (
        private readonly prisma: PrismaService,
        private readonly versionService: VersionService,
    ) {}

    async upload(
        versionId: string,
        file: Express.Multer.File,
        userId: string,
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        const version = await this.prisma.version.findUnique({
            where: {
                id: versionId,
            },
            include: {
                project: true,
            },
        });

        if (!version) {
            throw new NotFoundException('Version not found');
        }

        const project = version.project;
        if (project.ownerId !== userId) {
            throw new ForbiddenException('You are not allowed to upload files to this project');
        }

        return this.prisma.projectFile.create({
            data: {
                name: file.originalname,
                path: file.path,
                mimeType: file.mimetype,
                size: file.size,
                versionId,
            },
        });
    }
}