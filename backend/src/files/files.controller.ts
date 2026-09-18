import { Controller, Post, Get, Delete, Param, UploadedFile, UseGuards, UseInterceptors, Res } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FilesService } from './files.service';
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { multerConfig } from "./multer.config";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import type { CurrentUserType } from "src/auth/types/current-user.type";
import type { Response } from 'express';

@Controller()
@UseGuards(JwtAuthGuard)
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @Post('versions/:versionId/files')
    @UseInterceptors(FileInterceptor('file', multerConfig))
    upload(
        @Param('versionId') versionId: string,
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: CurrentUserType,
    ) {
        return this.filesService.upload(
            versionId,
            file,
            user.id,
        );
    }

    @Get('versions/:versionId/files')
    findByVersion(
        @Param('versionId') versionId: string,
        @CurrentUser() user: CurrentUserType,
    ) {
        return this.filesService.findByVersion(versionId, user.id);
    }

    @Get('files/:fileId')
    findOne(
        @Param('fileId') fileId: string,
        @CurrentUser() user: CurrentUserType,
    ) {
        return this.filesService.findOne(fileId, user.id);
    }

    @Delete('files/:fileId')
    remove(
        @Param('fileId') fileId: string,
        @CurrentUser() user: CurrentUserType,
    ) {
        return this.filesService.remove(fileId, user.id);
    }

    @Get('files/:fileId/download')
    async download(
        @Param('fileId') fileId: string,
        @CurrentUser() user: CurrentUserType,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { stream, fileRecord } = await this.filesService.download(fileId, user.id);
        
        res.set({
            'Content-Type': fileRecord.mimeType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${fileRecord.name}"`,
        });

        return stream;
    }
}