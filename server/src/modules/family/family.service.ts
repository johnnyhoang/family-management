import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family } from '../../common/entities/family.entity';
import { FamilyUser, FamilyUserStatus } from '../../common/entities/family-user.entity';
import { User } from '../../common/entities/user.entity';

@Injectable()
export class FamilyService {
  constructor(
    @InjectRepository(Family)
    private familyRepository: Repository<Family>,
    @InjectRepository(FamilyUser)
    private familyUserRepository: Repository<FamilyUser>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(id: string) {
    const family = await this.familyRepository.findOne({
      where: { id },
    });
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    const members = await this.familyUserRepository.find({
      where: { familyId: id, status: FamilyUserStatus.ACTIVE },
      relations: ['user', 'role'],
      order: { createdAt: 'ASC' },
    });

    return {
      ...family,
      members: members.map((membership) => ({
        id: membership.userId,
        email: membership.user?.email,
        fullName: membership.user?.fullName,
        role: membership.role?.code,
      })),
    };
  }

  async update(id: string, data: Partial<Family>) {
    const payload: Partial<Family> = {};
    if (data.name !== undefined) {
      payload.name = data.name;
    }
    await this.familyRepository.update(id, payload);
    return this.findOne(id);
  }

  async deleteFamily(familyId: string, userId: string) {
    const family = await this.familyRepository.findOne({ where: { id: familyId } });
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    const activeMembers = await this.familyUserRepository.find({
      where: { familyId, status: FamilyUserStatus.ACTIVE },
    });

    const otherMembers = activeMembers.filter((m) => m.userId !== userId);
    if (otherMembers.length > 0) {
      throw new BadRequestException(
        'Không thể xóa gia đình khi vẫn còn thành viên khác. Vui lòng chuyển quyền hoặc gỡ các thành viên khác trước khi xóa gia đình.',
      );
    }

    await this.familyRepository.manager.transaction(async (trx) => {
      await trx.query(`DELETE FROM invites WHERE "familyId" = $1`, [familyId]);
      await trx.query(`DELETE FROM family_users WHERE "familyId" = $1`, [familyId]);
      await trx.query(`DELETE FROM expenses WHERE "familyId" = $1`, [familyId]);
      await trx.query(`DELETE FROM asset_maintenances WHERE "familyId" = $1`, [familyId]);
      await trx.query(`DELETE FROM assets WHERE "familyId" = $1`, [familyId]);
      await trx.query(`DELETE FROM calendar_events WHERE "familyId" = $1`, [familyId]);
      await trx.query(`DELETE FROM categories WHERE "familyId" = $1`, [familyId]);
      await trx.query(`DELETE FROM gous_cases WHERE "familyId" = $1`, [familyId]);
      await trx.delete(Family, { id: familyId });
    });

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.lastActiveFamilyId === familyId) {
      const remainingMembership = await this.familyUserRepository.findOne({
        where: { userId, status: FamilyUserStatus.ACTIVE },
      });
      user.lastActiveFamilyId = remainingMembership?.familyId ?? null;
      await this.userRepository.save(user);
    }

    return { success: true, message: 'Đã xóa gia đình thành công' };
  }
}
