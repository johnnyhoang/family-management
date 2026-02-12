import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { PERMISSION_CHECK_KEY, PermissionCheck } from '../decorators/permission.decorator';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const check = this.reflector.getAllAndOverride<PermissionCheck>(
      PERMISSION_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!check) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    // System Admins have all permissions
    if (user.role === UserRole.SYSTEM_ADMIN) {
      return true;
    }

    // Family Admins have all permissions within their family
    if (user.role === UserRole.FAMILY_ADMIN) {
      return true;
    }

    const permission = await this.permissionRepository.findOne({
      where: {
        familyId: user.familyId,
        role: user.role,
        moduleId: check.moduleId,
      },
    });

    if (!permission) {
      throw new ForbiddenException('You do not have permission to access this module');
    }

    const actionMap = {
      view: permission.canView,
      add: permission.canAdd,
      edit: permission.canEdit,
      delete: permission.canDelete,
      notify: permission.canNotify,
    };

    if (!actionMap[check.action]) {
      throw new ForbiddenException(`You do not have ${check.action} permission for this module`);
    }

    return true;
  }
}
