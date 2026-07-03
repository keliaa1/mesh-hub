import { Controller, Post, Param, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {FilesService} from './files.service';
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { multerConfig } from "./multer.config";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import type { CurrentUserType } from "src/auth/types/current-user.type";

@Controller('files')
    export class FilesController{
        constructor(private readonly filesService: FilesService){}

        @Post(':versionId')
        @UseGuards(JwtAuthGuard)
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
    }