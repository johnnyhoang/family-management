import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, CategoryType } from '../../common/entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(familyId: string, type?: CategoryType) {
    return this.categoryRepository.find({
      where: { familyId, type },
      relations: ['children'],
    });
  }

  async create(familyId: string, data: Partial<Category>) {
    const category = this.categoryRepository.create({
      ...data,
      familyId,
    });
    return this.categoryRepository.save(category);
  }

  async findOne(id: string, familyId: string) {
    return this.categoryRepository.findOne({
      where: { id, familyId },
      relations: ['children', 'parent'],
    });
  }

  async delete(id: string, familyId: string) {
    const category = await this.findOne(id, familyId);
    if (category) {
      return this.categoryRepository.softRemove(category);
    }
    return null;
  }
}
