import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family, FamilyStatus } from '../../common/entities/family.entity';
import { User } from '../../common/entities/user.entity';
import { FamilyUser, FamilyUserStatus } from '../../common/entities/family-user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Family)
    private familyRepository: Repository<Family>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(FamilyUser)
    private familyUserRepository: Repository<FamilyUser>,
  ) {}

  async findAllFamilies() {
    const families = await this.familyRepository.find({
      order: { createdAt: 'ASC' },
    });

    const memberships = await this.familyUserRepository.find({
      where: { status: FamilyUserStatus.ACTIVE },
      relations: ['user', 'role'],
      order: { createdAt: 'ASC' },
    });

    return families.map((family) => ({
      ...family,
      members: memberships
        .filter((membership) => membership.familyId === family.id)
        .map((membership) => ({
          id: membership.userId,
          email: membership.user?.email,
          fullName: membership.user?.fullName,
          role: membership.role?.code,
        })),
    }));
  }

  async updateFamilyStatus(id: string, status: FamilyStatus) {
    await this.familyRepository.update(id, { status });
    return this.familyRepository.findOne({ where: { id } });
  }

  async getSystemStats() {
    const totalFamilies = await this.familyRepository.count();
    const totalUsers = await this.userRepository.count();
    const totalMemberships = await this.familyUserRepository.count({
      where: { status: FamilyUserStatus.ACTIVE },
    });
    return {
      totalFamilies,
      totalUsers,
      totalMemberships,
    };
  }
}
