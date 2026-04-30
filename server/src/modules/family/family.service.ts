import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family } from '../../common/entities/family.entity';
import { FamilyUser, FamilyUserStatus } from '../../common/entities/family-user.entity';

@Injectable()
export class FamilyService {
  constructor(
    @InjectRepository(Family)
    private familyRepository: Repository<Family>,
    @InjectRepository(FamilyUser)
    private familyUserRepository: Repository<FamilyUser>,
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
}
