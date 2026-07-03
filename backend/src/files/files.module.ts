import { Module } from "@nestjs/common";
import {FilesController} from "./files.controller";
import {FilesService} from "./files.service";
import {VersionsModule} from "../versions/versions.module";
@Module({
    imports: [VersionsModule],
    controllers:[FilesController],
    providers: [FilesService],
})

export class FilesModule{}