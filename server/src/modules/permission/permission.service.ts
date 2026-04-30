import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule, Permission, PermissionAction } from '../../common/entities/permission.entity';
import { Role, RoleScope } from '../../common/entities/role.entity';
import { RolePermission } from '../../common/entities/role-permission.entity';
import { UserRole } from '../../common/entities/user.entity';

type RoleTemplate = {
  role: UserRole;
  scope: RoleScope;
  permissions: Array<{ moduleKey: AppModule; action: PermissionAction }>;
};

const APP_ADMIN_ALLOWED: Array<{ moduleKey: AppModule; action: PermissionAction }> = [
  { moduleKey: AppModule.ADMIN, action: PermissionAction.VIEW },
  { moduleKey: AppModule.ADMIN, action: PermissionAction.UPDATE },
  { moduleKey: AppModule.FAMILY, action: PermissionAction.VIEW },
  { moduleKey: AppModule.FAMILY, action: PermissionAction.UPDATE },
  { moduleKey: AppModule.USER, action: PermissionAction.VIEW },
  { moduleKey: AppModule.USER, action: PermissionAction.UPDATE },
  { moduleKey: AppModule.PERMISSION, action: PermissionAction.VIEW },
  { moduleKey: AppModule.PERMISSION, action: PermissionAction.CREATE },
  { moduleKey: AppModule.PERMISSION, action: PermissionAction.UPDATE },
  { moduleKey: AppModule.PERMISSION, action: PermissionAction.DELETE },
];

const FAMILY_ADMIN_ALLOWED: Array<{ moduleKey: AppModule; action: PermissionAction }> = [
  { moduleKey: AppModule.FAMILY, action: PermissionAction.VIEW },
  { moduleKey: AppModule.FAMILY, action: PermissionAction.UPDATE },
  { moduleKey: AppModule.USER, action: PermissionAction.VIEW },
  { moduleKey: AppModule.USER, action: PermissionAction.CREATE },
  { moduleKey: AppModule.USER, action: PermissionAction.UPDATE },
  { moduleKey: AppModule.USER, action: PermissionAction.DELETE },
  { moduleKey: AppModule.DASHBOARD, action: PermissionAction.VIEW },
  { moduleKey: AppModule.CATEGORY, action: PermissionAction.VIEW },
  { moduleKey: AppModule.CATEGORY, action: PermissionAction.CREATE },
  { moduleKey: AppModule.CATEGORY, action: PermissionAction.UPDATE },
  { moduleKey: AppModule.CATEGORY, action: PermissionAction.DELETE },
  { moduleKey: AppModule.CALENDAR, action: PermissionAction.VIEW },
  { moduleKey: AppModule.CALENDAR, action: PermissionAction.CREATE },
  { moduleKey: AppModule.CALENDAR, action: PermissionAction.UPDATE },
  { moduleKey: AppModule.CALENDAR, action: PermissionAction.DELETE },
  { moduleKey: AppModule.ASSET, action: PermissionAction.VIEW },
  { moduleKey: AppModule.ASSET, action: PermissionAction.CREATE },
  { moduleKey: AppModule.ASSET, action: PermissionAction.UPDATE },
  { moduleKey: AppModule.ASSET, action: PermissionAction.DELETE },
  { moduleKey: AppModule.TRANSACTION, action: PermissionAction.VIEW },
  { moduleKey: AppModule.TRANSACTION, action: PermissionAction.CREATE },
  { moduleKey: AppModule.TRANSACTION, action: PermissionAction.UPDATE },
  { moduleKey: AppModule.TRANSACTION, action: PermissionAction.DELETE },
];

const MEMBER_ALLOWED: Array<{ moduleKey: AppModule; action: PermissionAction }> = [
  { moduleKey: AppModule.FAMILY, action: PermissionAction.VIEW },
  { moduleKey: AppModule.USER, action: PermissionAction.VIEW },
  { moduleKey: AppModule.DASHBOARD, action: PermissionAction.VIEW },
  { moduleKey: AppModule.CATEGORY, action: PermissionAction.VIEW },
  { moduleKey: AppModule.CALENDAR, action: PermissionAction.VIEW },
  { moduleKey: AppModule.CALENDAR, action: PermissionAction.CREATE },
  { moduleKey: AppModule.CALENDAR, action: PermissionAction.UPDATE },
  { moduleKey: AppModule.CALENDAR, action: PermissionAction.DELETE },
  { moduleKey: AppModule.ASSET, action: PermissionAction.VIEW },
  { moduleKey: AppModule.ASSET, action: PermissionAction.CREATE },
  { moduleKey: AppModule.ASSET, action: PermissionAction.UPDATE },
  { moduleKey: AppModule.ASSET, action: PermissionAction.DELETE },
  { moduleKey: AppModule.TRANSACTION, action: PermissionAction.VIEW },
  { moduleKey: AppModule.TRANSACTION, action: PermissionAction.CREATE },
  { moduleKey: AppModule.TRANSACTION, action: PermissionAction.UPDATE },
  { moduleKey: AppModule.TRANSACTION, action: PermissionAction.DELETE },
];

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async seedSystemPermissions() {
    const allDefinitions = this.buildPermissionDefinitions();

    for (const definition of allDefinitions) {
      const existing = await this.permissionRepository.findOne({
        where: {
          moduleKey: definition.moduleKey,
          action: definition.action,
        },
      });

      if (!existing) {
        await this.permissionRepository.save(this.permissionRepository.create(definition));
      }
    }

    for (const template of this.getRoleTemplates()) {
      const role = await this.ensureRole(template.role, template.scope);
      const permissions = await this.permissionRepository.find({
        where: template.permissions.map((permission) => ({
          moduleKey: permission.moduleKey,
          action: permission.action,
        })),
      });

      for (const permission of permissions) {
        const exists = await this.rolePermissionRepository.findOne({
          where: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });

        if (!exists) {
          await this.rolePermissionRepository.save(this.rolePermissionRepository.create({
            roleId: role.id,
            permissionId: permission.id,
          }));
        }
      }
    }
  }

  async findAllRoleTemplates() {
    return this.roleRepository.find({
      relations: ['rolePermissions', 'rolePermissions.permission'],
      order: { code: 'ASC' },
    });
  }

  async findRolePermissions(roleCode: UserRole) {
    const role = await this.roleRepository.findOne({
      where: { code: roleCode },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new NotFoundException('Role template not found');
    }

    return role;
  }

  async hasPermission(roleCode: UserRole, moduleId: string, action: string): Promise<boolean> {
    const role = await this.roleRepository.findOne({
      where: { code: roleCode },
    });

    if (!role) {
      return false;
    }

    const normalized = this.normalizePermission(moduleId, action);
    const permission = await this.permissionRepository.findOne({
      where: {
        moduleKey: normalized.moduleKey,
        action: normalized.action,
      },
    });

    if (!permission) {
      return false;
    }

    const rolePermission = await this.rolePermissionRepository.findOne({
      where: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });

    return Boolean(rolePermission);
  }

  async updateRoleTemplate(roleCode: UserRole, permissions: Array<{ moduleId: string; action: string }>) {
    const role = await this.roleRepository.findOne({ where: { code: roleCode } });
    if (!role) {
      throw new NotFoundException('Role template not found');
    }

    const normalized = permissions.map((permission) => this.normalizePermission(permission.moduleId, permission.action));
    const definitions = await this.permissionRepository.find({
      where: normalized.map((permission) => ({
        moduleKey: permission.moduleKey,
        action: permission.action,
      })),
    });

    await this.rolePermissionRepository.delete({ roleId: role.id });

    if (definitions.length) {
      await this.rolePermissionRepository.save(definitions.map((permission) =>
        this.rolePermissionRepository.create({
          roleId: role.id,
          permissionId: permission.id,
        }),
      ));
    }

    return this.findRolePermissions(roleCode);
  }

  async getRoleByCode(roleCode: UserRole) {
    const role = await this.roleRepository.findOne({ where: { code: roleCode } });
    if (!role) {
      throw new NotFoundException(`Role ${roleCode} not found`);
    }
    return role;
  }

  normalizePermission(moduleId: string, action: string): { moduleKey: AppModule; action: PermissionAction } {
    const moduleAliases: Record<string, AppModule> = {
      admin: AppModule.ADMIN,
      family: AppModule.FAMILY,
      user: AppModule.USER,
      permission: AppModule.PERMISSION,
      dashboard: AppModule.DASHBOARD,
      category: AppModule.CATEGORY,
      calendar: AppModule.CALENDAR,
      asset: AppModule.ASSET,
      expense: AppModule.TRANSACTION,
      transaction: AppModule.TRANSACTION,
    };

    const actionAliases: Record<string, PermissionAction> = {
      view: PermissionAction.VIEW,
      add: PermissionAction.CREATE,
      create: PermissionAction.CREATE,
      edit: PermissionAction.UPDATE,
      update: PermissionAction.UPDATE,
      delete: PermissionAction.DELETE,
    };

    const moduleKey = moduleAliases[moduleId.toLowerCase()];
    const normalizedAction = actionAliases[action.toLowerCase()];

    if (!moduleKey || !normalizedAction) {
      throw new NotFoundException(`Permission mapping not found for ${moduleId}:${action}`);
    }

    return { moduleKey, action: normalizedAction };
  }

  private buildPermissionDefinitions(): Array<Pick<Permission, 'moduleKey' | 'action' | 'name'>> {
    const definitions: Array<Pick<Permission, 'moduleKey' | 'action' | 'name'>> = [];
    const modules = Object.values(AppModule);
    const actions = Object.values(PermissionAction);

    for (const moduleKey of modules) {
      for (const action of actions) {
        definitions.push({
          moduleKey,
          action,
          name: `${moduleKey}.${action}`,
        });
      }
    }

    return definitions;
  }

  private getRoleTemplates(): RoleTemplate[] {
    return [
      { role: UserRole.APP_ADMIN, scope: RoleScope.SYSTEM, permissions: APP_ADMIN_ALLOWED },
      { role: UserRole.FAMILY_ADMIN, scope: RoleScope.FAMILY, permissions: FAMILY_ADMIN_ALLOWED },
      { role: UserRole.MEMBER, scope: RoleScope.FAMILY, permissions: MEMBER_ALLOWED },
    ];
  }

  private async ensureRole(roleCode: UserRole, scope: RoleScope): Promise<Role> {
    const existing = await this.roleRepository.findOne({
      where: { code: roleCode },
    });

    if (existing) {
      return existing;
    }

    return this.roleRepository.save(this.roleRepository.create({
      code: roleCode,
      name: roleCode,
      scope,
      isTemplate: true,
    }));
  }
}
