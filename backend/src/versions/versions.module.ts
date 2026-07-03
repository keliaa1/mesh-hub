import { Module } from '@nestjs/common';
import { ProjectsModule } from 'src/projects/projects.module';

@Module({
    imports:[ProjectsModule],
  controllers: [VersionsController],
  providers: [VersionService],
})
export class VersionsModule {}