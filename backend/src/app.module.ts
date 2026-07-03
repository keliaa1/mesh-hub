import { Module } from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {PrismaModule} from './prisma/prisma.module';
import {UsersModule} from './users/users.module';
import {ProjectsModule} from './projects/projects.module';
import {VersionsModule} from './versions/versions.module';
import {AuthModule} from './auth/auth.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    ProjectsModule,
    VersionsModule,
    AuthModule,
    FilesModule,
  ],
})
export class AppModule {}
