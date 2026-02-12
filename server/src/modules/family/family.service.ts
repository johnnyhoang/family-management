import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family } from '../../common/entities/family.entity';

@Injectable()
export class FamilyService {
  constructor(
    @InjectRepository(Family)
    private familyRepository: Repository<Family>,
  ) {}

  async findOne(id: string) {
    const family = await this.familyRepository.findOne({
      where: { id },
    });
    if (!family) {
      throw new NotFoundException('Family not found');
    }
    return family;
  }

  async update(id: string, data: Partial<Family>) {
    await this.familyRepository.update(id, data);
    return this.findOne(id);
  }
}
