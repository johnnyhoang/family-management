import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../../common/entities/permission.entity';
import { UserRole } from '../../common/entities/user.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async findAll(familyId: string) {
    return this.permissionRepository.find({
      where: { familyId },
    });
  }

  async findByRole(familyId: string, role: UserRole) {
    return this.permissionRepository.find({
      where: { familyId, role },
    });
  }

  async create(familyId: string, data: Partial<Permission>) {
    const permission = this.permissionRepository.create({
      ...data,
      familyId,
    });
    return this.permissionRepository.save(permission);
  }

  async update(id: string, familyId: string, data: Partial<Permission>) {
    const permission = await this.permissionRepository.findOne({
      where: { id, familyId },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    Object.assign(permission, data);
    return this.permissionRepository.save(permission);
  }

  async remove(id: string, familyId: string) {
    const permission = await this.permissionRepository.findOne({
      where: { id, familyId },
    });
    if (permission) {
      return this.permissionRepository.remove(permission);
    }
  }

  async seedDefaultPermissions(familyId: string) {
    const defaultPermissions = [
      // Family Admin permissions
      { role: UserRole.FAMILY_ADMIN, moduleId: 'User', canView: true, canAdd: true, canEdit: true, canDelete: true },
      { role: UserRole.FAMILY_ADMIN, moduleId: 'Asset', canView: true, canAdd: true, canEdit: true, canDelete: true },
      { role: UserRole.FAMILY_ADMIN, moduleId: 'Expense', canView: true, canAdd: true, canEdit: true, canDelete: true },
      { role: UserRole.FAMILY_ADMIN, moduleId: 'Category', canView: true, canAdd: true, canEdit: true, canDelete: true },
      { role: UserRole.FAMILY_ADMIN, moduleId: 'Dashboard', canView: true },
      // Member permissions
      { role: UserRole.MEMBER, moduleId: 'Asset', canView: true, canAdd: true, canEdit: true },
      { role: UserRole.MEMBER, moduleId: 'Expense', canView: true, canAdd: true, canEdit: true },
      { role: UserRole.MEMBER, moduleId: 'Category', canView: true },
      { role: UserRole.MEMBER, moduleId: 'Dashboard', canView: true },
    ];

    for (const p of defaultPermissions) {
      const exists = await this.permissionRepository.findOne({
        where: { familyId, role: p.role as UserRole, moduleId: p.moduleId },
      });
      if (!exists) {
        await this.create(familyId, p as any);
      }
    }
  }
}
