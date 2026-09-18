import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PermissionService } from 'src/common/permission.service';

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

import type { Response } from 'express';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: PermissionService,
  ) {}

  // ========================================================
  // CREATE PROJECT
  // ========================================================

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

  // ========================================================
  // FIND ALL PROJECTS
  // ========================================================

  async findAll(
    page: number,
    limit: number,
    userId: string,
    search?: string,
    sort?: string,
    order?: 'asc' | 'desc',
  ) {
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      OR: [
        {
          visibility: 'PUBLIC',
        },

        {
          ownerId: userId,
        },

        {
          collaborators: {
            some: {
              userId,
            },
          },
        },
      ],
    };

    if (search) {
      whereCondition.AND = [
        {
          OR: [
            {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            },

            {
              description: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
      ];
    }

    const orderBy: any = {};

    if (sort) {
      orderBy[sort] = order || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where: whereCondition,

        skip,

        take: limit,

        orderBy,

        include: {
          owner: {
            select: {
              id: true,

              username: true,

              avatar: true,
            },
          },
        },
      }),

      this.prisma.project.count({
        where: whereCondition,
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

  // ========================================================
  // FIND ONE PROJECT
  // ========================================================

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id,
      },

      include: {
        collaborators: {
          include: {
            user: {
              select: {
                id: true,

                username: true,

                email: true,

                avatar: true,
              },
            },
          },
        },

        owner: {
          select: {
            id: true,

            username: true,

            avatar: true,
          },
        },

        versions: {
          orderBy: {
            versionNumber: 'desc',
          },

          include: {
            files: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    this.permissionService.assertCanView(project, userId);

    return project;
  }

  // ========================================================
  // UPDATE PROJECT
  // ========================================================

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    const project = await this.permissionService.getProjectOrFail(id);

    this.permissionService.assertCanManageCollaborators(project, userId);

    return this.prisma.project.update({
      where: {
        id,
      },

      data: dto,
    });
  }

  // ========================================================
  // DELETE PROJECT
  // ========================================================

  async remove(id: string, userId: string) {
    const project = await this.permissionService.getProjectOrFail(id);

    this.permissionService.assertCanDelete(project, userId);

    const versions = await this.prisma.version.findMany({
      where: {
        projectId: id,
      },

      include: {
        files: true,
      },
    });

    /*
     * Collect unique physical files.
     *
     * Multiple versions can point to the same
     * content-addressed blob.
     */

    const paths = new Set<string>();

    for (const version of versions) {
      for (const file of version.files) {
        paths.add(file.path);
      }
    }

    /*
     * Delete physical files.
     */

    for (const filePath of paths) {
      try {
        await fs.unlink(filePath);
      } catch {
        console.error(`Failed to delete file: ${filePath}`);
      }
    }

    /*
     * Delete project directory.
     */

    const projectDir = path.join(
      process.cwd(),

      'uploads',

      'projects',

      id,
    );

    try {
      await fs.rm(projectDir, {
        recursive: true,
        force: true,
      });
    } catch {
      console.error(`Failed to delete project directory: ${projectDir}`);
    }

    await this.prisma.project.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Project successfully deleted',
    };
  }

  // ========================================================
  // PUSH
  // ========================================================

  async push(
    projectId: string,
    file: Express.Multer.File,
    userId: string,
    commitMessage?: string,
  ) {
    // ----------------------------------------------------
    // Validate file
    // ----------------------------------------------------

    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }

    // ----------------------------------------------------
    // Get project
    // ----------------------------------------------------

    const project = await this.permissionService.getProjectOrFail(projectId);

    // ----------------------------------------------------
    // Check permission
    // ----------------------------------------------------

    this.permissionService.assertCanPush(project, userId);

    // ----------------------------------------------------
    // Make sure this is a Blender file
    // ----------------------------------------------------

    if (!file.originalname.toLowerCase().endsWith('.blend')) {
      throw new BadRequestException('Only .blend files are supported');
    }

    // ----------------------------------------------------
    // Calculate SHA-256 checksum
    // ----------------------------------------------------

    const checksum = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    // ----------------------------------------------------
    // Find latest version
    // ----------------------------------------------------

    const latestVersion = await this.prisma.version.findFirst({
      where: {
        projectId,
      },

      orderBy: {
        versionNumber: 'desc',
      },
    });

    const nextVersionNumber = latestVersion
      ? latestVersion.versionNumber + 1
      : 1;

    // ----------------------------------------------------
    // Project directories
    // ----------------------------------------------------

    const projectDir = path.join(
      process.cwd(),

      'uploads',

      'projects',

      projectId,
    );

    const blobsDir = path.join(
      projectDir,

      'blobs',
    );

    await fs.mkdir(blobsDir, {
      recursive: true,
    });

    // ----------------------------------------------------
    // Content-addressed file
    // ----------------------------------------------------

    const blobPath = path.join(
      blobsDir,

      `${checksum}.blend`,
    );

    /*
     * Only write the blob if it doesn't already exist.
     *
     * If exactly the same .blend is pushed twice,
     * we reuse the existing physical file.
     */

    try {
      await fs.access(blobPath);
    } catch {
      await fs.writeFile(blobPath, file.buffer);
    }

    // ----------------------------------------------------
    // Current working file
    // ----------------------------------------------------

    const currentFilePath = path.join(
      projectDir,

      'current.blend',
    );

    /*
     * current.blend is always the latest version.
     */

    await fs.copyFile(blobPath, currentFilePath);

    // ----------------------------------------------------
    // Create Version
    // ----------------------------------------------------

    const version = await this.prisma.version.create({
      data: {
        projectId,

        versionNumber: nextVersionNumber,

        commitMessage: commitMessage?.trim() || 'Push from Blender',
      },
    });

    // ----------------------------------------------------
    // Create ProjectFile
    // ----------------------------------------------------

    const projectFile = await this.prisma.projectFile.create({
      data: {
        name: file.originalname,

        path: blobPath,

        size: file.size,

        mimeType: file.mimetype || 'application/x-blender',

        checksum,

        versionId: version.id,
      },
    });

    return {
      message: 'Project pushed successfully',

      version: {
        id: version.id,

        versionNumber: version.versionNumber,

        commitMessage: version.commitMessage,

        checksum,
      },

      file: {
        id: projectFile.id,

        name: projectFile.name,

        size: projectFile.size,

        mimeType: projectFile.mimeType,
      },
    };
  }

  // ========================================================
  // DOWNLOAD CURRENT
  // ========================================================

  async downloadCurrent(projectId: string, userId: string, res: Response) {
    const project = await this.permissionService.getProjectOrFail(projectId);

    this.permissionService.assertCanView(project, userId);

    const projectDir = path.join(
      process.cwd(),

      'uploads',

      'projects',

      projectId,
    );

    const currentFilePath = path.join(
      projectDir,

      'current.blend',
    );

    try {
      await fs.access(currentFilePath);
    } catch {
      throw new NotFoundException(
        'No Blender file has been pushed ' + 'to this project yet',
      );
    }

    return res.download(
      currentFilePath,

      `${project.title}.blend`,
    );
  }

  // ========================================================
  // VERSION HISTORY
  // ========================================================

  async getVersionHistory(projectId: string, userId: string) {
    const project = await this.permissionService.getProjectOrFail(projectId);

    this.permissionService.assertCanView(project, userId);

    const versions = await this.prisma.version.findMany({
      where: {
        projectId,
      },

      orderBy: {
        versionNumber: 'desc',
      },

      include: {
        files: {
          select: {
            id: true,

            name: true,

            size: true,

            mimeType: true,

            checksum: true,

            createdAt: true,
          },
        },
      },
    });

    return {
      project: {
        id: project.id,

        title: project.title,
      },

      versions,
    };
  }

  // ========================================================
  // DOWNLOAD SPECIFIC VERSION
  // ========================================================

  async downloadVersion(
    projectId: string,
    versionNumber: number,
    userId: string,
    res: Response,
  ) {
    const project = await this.permissionService.getProjectOrFail(projectId);

    this.permissionService.assertCanView(project, userId);

    const version = await this.prisma.version.findFirst({
      where: {
        projectId,

        versionNumber,
      },

      include: {
        files: true,
      },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }

    const projectFile = version.files[0];

    if (!projectFile) {
      throw new NotFoundException(`No file found for version ${versionNumber}`);
    }

    try {
      await fs.access(projectFile.path);
    } catch {
      throw new NotFoundException('Version file is missing from storage');
    }

    return res.download(
      projectFile.path,

      `${project.title}_v${versionNumber}.blend`,
    );
  }

  // ========================================================
  // RESTORE VERSION
  // ========================================================

  async restoreVersion(
    projectId: string,
    versionNumber: number,
    userId: string,
  ) {
    // ----------------------------------------------------
    // Get project
    // ----------------------------------------------------

    const project = await this.permissionService.getProjectOrFail(projectId);

    // ----------------------------------------------------
    // Only OWNER or EDITOR can restore (VIEWER forbidden)
    // ----------------------------------------------------

    this.permissionService.assertCanRestore(project, userId);

    // ----------------------------------------------------
    // Find version
    // ----------------------------------------------------

    const version = await this.prisma.version.findFirst({
      where: {
        projectId,

        versionNumber,
      },

      include: {
        files: true,
      },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }

    const sourceFile = version.files[0];

    if (!sourceFile) {
      throw new NotFoundException('Version does not contain a file');
    }

    // ----------------------------------------------------
    // Make sure source exists
    // ----------------------------------------------------

    try {
      await fs.access(sourceFile.path);
    } catch {
      throw new NotFoundException('Version file is missing from storage');
    }

    // ----------------------------------------------------
    // Current file
    // ----------------------------------------------------

    const projectDir = path.join(
      process.cwd(),

      'uploads',

      'projects',

      projectId,
    );

    const currentFilePath = path.join(
      projectDir,

      'current.blend',
    );

    // ----------------------------------------------------
    // Restore the selected version
    // ----------------------------------------------------

    await fs.copyFile(
      sourceFile.path,

      currentFilePath,
    );

    // ----------------------------------------------------
    // Create a new version representing the restore
    // ----------------------------------------------------

    const latestVersion = await this.prisma.version.findFirst({
      where: {
        projectId,
      },

      orderBy: {
        versionNumber: 'desc',
      },
    });

    const nextVersionNumber = latestVersion
      ? latestVersion.versionNumber + 1
      : 1;

    const restoredVersion = await this.prisma.version.create({
      data: {
        projectId,

        versionNumber: nextVersionNumber,

        commitMessage: `Restore version ${versionNumber}`,
      },
    });

    await this.prisma.projectFile.create({
      data: {
        name: sourceFile.name,

        path: sourceFile.path,

        size: sourceFile.size,

        mimeType: sourceFile.mimeType,

        checksum: sourceFile.checksum,

        versionId: restoredVersion.id,
      },
    });

    return {
      message: `Version ${versionNumber} restored successfully`,

      restoredFrom: {
        versionNumber,
      },

      newVersion: {
        id: restoredVersion.id,

        versionNumber: restoredVersion.versionNumber,

        commitMessage: restoredVersion.commitMessage,
      },
    };
  }

  // ========================================================
  // FIND BY ID
  // ========================================================

  async findById(projectId: string) {
    return this.prisma.project.findUnique({
      where: {
        id: projectId,
      },

      include: {
        owner: true,

        collaborators: true,
      },
    });
  }
}
