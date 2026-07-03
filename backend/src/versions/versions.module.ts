import { Module } from '@nestjs/common';
import { ProjectsModule } from 'src/projects/projects.module';
import { VersionsController } from './versions.controller';
import { VersionService } from './versions.service';

@Module({
  imports:[ProjectsModule],
  controllers: [VersionsController],
  providers: [VersionService],
  exports: [VersionService],
})
export class VersionsModule {}