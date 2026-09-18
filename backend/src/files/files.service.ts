import { Injectable, NotFoundException, BadRequestException, StreamableFile } from "@nestjs/common";
import { PrismaService } from '../prisma/prisma.service';
import { PermissionService } from "src/common/permission.service";
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import { join } from 'path';

@Injectable()
export class FilesService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly permissionService: PermissionService,
    ) {}

    private async calculateChecksum(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);
            stream.on('error', err => reject(err));
            stream.on('data', chunk => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
        });
    }

    async upload(
        versionId: string,
        file: Express.Multer.File,
        userId: string,
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        const version = await this.prisma.version.findUnique({
            where: { id: versionId },
        });

        if (!version) {
            // Delete file if we throw
            await fsp.unlink(file.path).catch(() => {});
            throw new NotFoundException('Version not found');
        }

        const project = await this.permissionService.getProjectOrFail(version.projectId);
        
        try {
            this.permissionService.assertCanEdit(project, userId);
        } catch (e) {
            // Clean up file if they can't edit
            await fsp.unlink(file.path).catch(() => {});
            throw e;
        }

        const checksum = await this.calculateChecksum(file.path);

        return this.prisma.projectFile.create({
            data: {
                name: file.originalname,
                path: file.path,
                mimeType: file.mimetype,
                size: file.size,
                checksum,
                versionId,
            },
        });
    }

    async findByVersion(versionId: string, userId: string) {
        const version = await this.prisma.version.findUnique({
            where: { id: versionId },
        });

        if (!version) {
            throw new NotFoundException('Version not found');
        }

        const project = await this.permissionService.getProjectOrFail(version.projectId);
        this.permissionService.assertCanView(project, userId);

        return this.prisma.projectFile.findMany({
            where: { versionId },
        });
    }

    async findOne(fileId: string, userId: string) {
        const file = await this.prisma.projectFile.findUnique({
            where: { id: fileId },
            include: { version: true },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        const project = await this.permissionService.getProjectOrFail(file.version.projectId);
        this.permissionService.assertCanView(project, userId);

        return file;
    }

    async remove(fileId: string, userId: string) {
        const file = await this.prisma.projectFile.findUnique({
            where: { id: fileId },
            include: { version: true },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        const project = await this.permissionService.getProjectOrFail(file.version.projectId);
        this.permissionService.assertCanEdit(project, userId);

        // Delete from disk
        await fsp.unlink(file.path).catch(() => console.error(`Failed to delete file from disk: ${file.path}`));

        // Delete from DB
        await this.prisma.projectFile.delete({
            where: { id: fileId },
        });

        return { message: 'File deleted successfully' };
    }

    async download(fileId: string, userId: string) {
        const fileRecord = await this.findOne(fileId, userId);
        const stream = fs.createReadStream(join(process.cwd(), fileRecord.path));
        
        return {
            stream: new StreamableFile(stream),
            fileRecord,
        };
    }
}