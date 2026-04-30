import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { PERMISSION_CHECK_KEY, PermissionCheck } from '../decorators/permission.decorator';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

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
      this.logger.warn('No user found in request');
      return false;
    }

    this.logger.debug(`Checking ${check.action} on ${check.moduleId} for ${user.email} (role: ${user.role})`);

    if (user.role === UserRole.SYSTEM_ADMIN || user.role === UserRole.FAMILY_ADMIN) {
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
      this.logger.debug(`No permission: role=${user.role}, module=${check.moduleId}, family=${user.familyId}`);
      throw new ForbiddenException('You do not have permission to access this module');
    }

    const actionMap: Record<string, boolean> = {
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
