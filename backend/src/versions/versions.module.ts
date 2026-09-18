import { Module } from '@nestjs/common';
import { VersionsController } from './versions.controller';
import { VersionService } from './versions.service';

@Module({
  controllers: [VersionsController],
  providers: [VersionService],
  exports: [VersionService],
})
export class VersionsModule {}