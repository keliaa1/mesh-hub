import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * PermissionService — centralized authorization logic.
 *
 * All project authorization rules live here so that controllers/services
 * don't need to duplicate permission checks.
 */
@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Load a project together with its collaborators.
   */
  async getProjectOrFail(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { collaborators: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  /**
   * Get the user's role on the project.
   *
   * The owner is treated as OWNER even though they do not need
   * a Collaborator database record.
   */
  private getCollaboratorRole(
    project: {
      ownerId: string;
      collaborators: { userId: string; role: string }[];
    },
    userId: string,
  ): string | null {
    if (project.ownerId === userId) {
      return 'OWNER';
    }

    const collaborator = project.collaborators.find(
      (collaborator) => collaborator.userId === userId,
    );

    return collaborator?.role ?? null;
  }

  /**
   * Can the user VIEW/PULL this project?
   *
   * PUBLIC and UNLISTED projects can be viewed by any authenticated user.
   *
   * PRIVATE projects require the user to be:
   * - OWNER
   * - EDITOR
   * - VIEWER
   */
  canView(
    project: {
      visibility: string;
      ownerId: string;
      collaborators: { userId: string; role: string }[];
    },
    userId: string,
  ): boolean {
    if (project.visibility === 'PUBLIC' || project.visibility === 'UNLISTED') {
      return true;
    }

    const role = this.getCollaboratorRole(project, userId);

    return role !== null;
  }

  /**
   * Can the user PUSH/EDIT the project?
   *
   * OWNER and EDITOR can edit.
   */
  canEdit(
    project: {
      ownerId: string;
      collaborators: { userId: string; role: string }[];
    },
    userId: string,
  ): boolean {
    const role = this.getCollaboratorRole(project, userId);

    return role === 'OWNER' || role === 'EDITOR';
  }

  /**
   * Can the user PUSH changes?
   *
   * Same permission as editing.
   */
  canPush(
    project: {
      ownerId: string;
      collaborators: { userId: string; role: string }[];
    },
    userId: string,
  ): boolean {
    return this.canEdit(project, userId);
  }

  /**
   * Can the user RESTORE an older version?
   *
   * OWNER and EDITOR can restore.
   */
  canRestore(
    project: {
      ownerId: string;
      collaborators: { userId: string; role: string }[];
    },
    userId: string,
  ): boolean {
    return this.canEdit(project, userId);
  }

  /**
   * Can the user DELETE the project?
   *
   * OWNER only.
   */
  canDelete(project: { ownerId: string }, userId: string): boolean {
    return project.ownerId === userId;
  }

  /**
   * Can the user manage collaborators?
   *
   * OWNER only.
   */
  canManageCollaborators(
    project: { ownerId: string },
    userId: string,
  ): boolean {
    return project.ownerId === userId;
  }

  // ─────────────────────────────────────────────
  // Assertion methods
  // ─────────────────────────────────────────────

  assertCanView(
    project: {
      visibility: string;
      ownerId: string;
      collaborators: { userId: string; role: string }[];
    },
    userId: string,
  ) {
    if (!this.canView(project, userId)) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  assertCanEdit(
    project: {
      ownerId: string;
      collaborators: { userId: string; role: string }[];
    },
    userId: string,
  ) {
    if (!this.canEdit(project, userId)) {
      throw new ForbiddenException(
        'You do not have edit access to this project',
      );
    }
  }

  assertCanPush(
    project: {
      ownerId: string;
      collaborators: { userId: string; role: string }[];
    },
    userId: string,
  ) {
    if (!this.canPush(project, userId)) {
      throw new ForbiddenException(
        'Only the project owner or an editor can push changes',
      );
    }
  }

  assertCanRestore(
    project: {
      ownerId: string;
      collaborators: { userId: string; role: string }[];
    },
    userId: string,
  ) {
    if (!this.canRestore(project, userId)) {
      throw new ForbiddenException(
        'Only the project owner or an editor can restore versions',
      );
    }
  }

  assertCanDelete(project: { ownerId: string }, userId: string) {
    if (!this.canDelete(project, userId)) {
      throw new ForbiddenException(
        'Only the project owner can delete this project',
      );
    }
  }

  assertCanManageCollaborators(project: { ownerId: string }, userId: string) {
    if (!this.canManageCollaborators(project, userId)) {
      throw new ForbiddenException(
        'Only the project owner can manage collaborators',
      );
    }
  }
}
