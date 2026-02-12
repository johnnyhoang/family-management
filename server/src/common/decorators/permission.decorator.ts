import { SetMetadata } from '@nestjs/common';

export const PERMISSION_CHECK_KEY = 'permission_check';

export interface PermissionCheck {
  moduleId: string;
  action: 'view' | 'add' | 'edit' | 'delete' | 'notify';
}

export const CheckPermission = (moduleId: string, action: 'view' | 'add' | 'edit' | 'delete' | 'notify') =>
  SetMetadata(PERMISSION_CHECK_KEY, { moduleId, action });
