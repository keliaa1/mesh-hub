import { Module, Global } from '@nestjs/common';
import { PermissionService } from './permission.service';

/**
 * CommonModule is marked @Global so PermissionService is available
 * throughout the entire application without needing to import this module
 * in every feature module.
 */
@Global()
@Module({
  providers: [PermissionService],
  exports: [PermissionService],
})
export class CommonModule {}
