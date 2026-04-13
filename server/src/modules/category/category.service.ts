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
    const where = type ? { familyId, type } : { familyId };
    return this.categoryRepository.find({
      where,
      relations: ['children'],
    });
  }

  /** Tạo danh mục thu mặc định nếu gia đình chưa có (tránh form Thu vào không có lựa chọn). */
  async ensureDefaultIncomeCategories(familyId: string): Promise<void> {
    const n = await this.categoryRepository.count({
      where: { familyId, type: CategoryType.INCOME },
    });
    if (n > 0) return;
    const defaults = [
      { name: 'Lương / Thu nhập chính', type: CategoryType.INCOME, isDefault: true },
      { name: 'Thưởng, quà, hoàn tiền', type: CategoryType.INCOME, isDefault: true },
      { name: 'Lãi đầu tư, cổ tức', type: CategoryType.INCOME, isDefault: true },
    ];
    for (const d of defaults) {
      await this.categoryRepository.save(
        this.categoryRepository.create({ ...d, familyId }),
      );
    }
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
