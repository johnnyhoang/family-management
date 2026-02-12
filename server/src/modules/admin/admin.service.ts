import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family } from '../../common/entities/family.entity';
import { User } from '../../common/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Family)
    private familyRepository: Repository<Family>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAllFamilies() {
    return this.familyRepository.find();
  }

  async updateFamilyStatus(id: string, status: any) {
    await this.familyRepository.update(id, { status });
    return this.familyRepository.findOne({ where: { id } });
  }

  async getSystemStats() {
    const totalFamilies = await this.familyRepository.count();
    const totalUsers = await this.userRepository.count();
    return {
      totalFamilies,
      totalUsers,
    };
  }
}
