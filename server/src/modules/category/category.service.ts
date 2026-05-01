import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category, CategoryLevel, CategoryType } from '../../common/entities/category.entity';

const DEFAULT_GROUP_NAMES: Record<CategoryType, string> = {
  [CategoryType.ASSET]: 'Tổng quát',
  [CategoryType.LIABILITY]: 'Công nợ chung',
  [CategoryType.INCOME]: 'Thu nhập chung',
  [CategoryType.EXPENSE]: 'Chi phí chung',
};

const DEFAULT_CATEGORY_TREE: Array<{
  type: CategoryType;
  groups: Array<{ name: string; categories: string[] }>;
}> = [
  {
    type: CategoryType.ASSET,
    groups: [
      { name: 'Thanh khoản', categories: ['Tiền mặt', 'Tài khoản ngân hàng'] },
      { name: 'Đầu tư', categories: ['Cổ phiếu', 'Crypto'] },
      { name: 'Tài sản dài hạn', categories: ['Nhà đất', 'Xe cộ'] },
    ],
  },
  {
    type: CategoryType.LIABILITY,
    groups: [
      { name: 'Công nợ', categories: ['Khoản vay', 'Thẻ tín dụng'] },
    ],
  },
  {
    type: CategoryType.INCOME,
    groups: [
      { name: 'Thu nhập chính', categories: ['Lương / Thu nhập chính'] },
      { name: 'Thu nhập khác', categories: ['Thưởng, quà, hoàn tiền', 'Lãi đầu tư, cổ tức'] },
    ],
  },
  {
    type: CategoryType.EXPENSE,
    groups: [
      { name: 'Sinh hoạt', categories: ['Ăn uống', 'Đi lại', 'Hóa đơn'] },
    ],
  },
];

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(familyId: string, type?: CategoryType) {
    await this.repairInvalidParentAssignments(familyId);
    const where = type ? { familyId, type } : { familyId };
    return this.categoryRepository.find({
      where,
      relations: ['parent'],
      order: {
        type: 'ASC',
        level: 'ASC',
        name: 'ASC',
      },
    });
  }

  async ensureDefaultIncomeCategories(familyId: string): Promise<void> {
    for (const typeDef of DEFAULT_CATEGORY_TREE) {
      for (const groupDef of typeDef.groups) {
        const group = await this.findOrCreateCategory(familyId, {
          name: groupDef.name,
          type: typeDef.type,
          level: CategoryLevel.GROUP,
          isDefault: true,
        });

        for (const categoryName of groupDef.categories) {
          await this.findOrCreateCategory(familyId, {
            name: categoryName,
            type: typeDef.type,
            level: CategoryLevel.CATEGORY,
            parentId: group.id,
            isDefault: true,
          });
        }
      }
    }
  }

  async create(familyId: string, data: Partial<Category>) {
    const type = data.type;
    const level = data.level ?? CategoryLevel.CATEGORY;
    this.validateCategoryShape(type, level);

    const parentId = await this.resolveParentId(familyId, type, level, data.parentId ?? null);
    const category = this.categoryRepository.create({
      ...data,
      familyId,
      level,
      parentId,
    });
    return this.categoryRepository.save(category);
  }

  async findOne(id: string, familyId: string) {
    return this.categoryRepository.findOne({
      where: { id, familyId },
      relations: ['children', 'parent'],
    });
  }

  async update(id: string, familyId: string, data: Partial<Category>) {
    const category = await this.findOne(id, familyId);
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    const nextType = data.type ?? category.type;
    const nextLevel = data.level ?? category.level;
    this.validateCategoryShape(nextType, nextLevel);

    if (nextLevel === CategoryLevel.CATEGORY && category.children?.length) {
      throw new BadRequestException('Danh mục nhóm đang có danh mục con, không thể chuyển thành danh mục lá');
    }

    const nextParentId = await this.resolveParentId(
      familyId,
      nextType,
      nextLevel,
      data.parentId ?? category.parentId ?? null,
      id,
    );

    await this.categoryRepository.update(
      { id, familyId },
      {
        name: data.name !== undefined ? data.name : category.name,
        isDefault: data.isDefault !== undefined ? data.isDefault : category.isDefault,
        type: nextType,
        level: nextLevel,
        parentId: nextParentId,
        ...(data.updatedBy !== undefined ? { updatedBy: data.updatedBy } : {}),
      },
    );

    // Cascade type change to children when GROUP type changes
    if (nextType !== category.type && nextLevel === CategoryLevel.GROUP) {
      await this.categoryRepository.update({ familyId, parentId: id }, { type: nextType });
    }

    return this.findOne(id, familyId);
  }

  async delete(id: string, familyId: string) {
    const category = await this.findOne(id, familyId);
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return this.categoryRepository.softRemove(category);
  }

  async ensureDefaultGroup(familyId: string, type: CategoryType): Promise<Category> {
    return this.findOrCreateCategory(familyId, {
      name: DEFAULT_GROUP_NAMES[type],
      type,
      level: CategoryLevel.GROUP,
      isDefault: true,
    });
  }

  private async findOrCreateCategory(familyId: string, data: Partial<Category>): Promise<Category> {
    const existing = await this.categoryRepository.findOne({
      where: {
        familyId,
        name: data.name,
        type: data.type,
        level: data.level,
        parentId: data.parentId ?? IsNull(),
      },
    });

    if (existing) return existing;

    const category = this.categoryRepository.create({
      ...data,
      familyId,
      parentId: data.parentId ?? null,
    });

    return this.categoryRepository.save(category);
  }

  private async resolveParentId(
    familyId: string,
    type: CategoryType | undefined,
    level: CategoryLevel,
    parentId: string | null,
    currentCategoryId?: string,
  ): Promise<string | null> {
    if (!type) {
      throw new BadRequestException('Loại danh mục là bắt buộc');
    }

    if (level === CategoryLevel.GROUP) {
      if (parentId) {
        throw new BadRequestException('Nhóm danh mục không được có danh mục cha');
      }
      return null;
    }

    if (!parentId) {
      const defaultGroup = await this.ensureDefaultGroup(familyId, type);
      if (currentCategoryId && defaultGroup.id === currentCategoryId) {
        throw new BadRequestException('Danh mục không thể tự làm danh mục cha');
      }
      return defaultGroup.id;
    }

    if (currentCategoryId && parentId === currentCategoryId) {
      throw new BadRequestException('Danh mục không thể tự làm danh mục cha');
    }

    const parent = await this.categoryRepository.findOne({
      where: { id: parentId, familyId },
      relations: ['parent'],
    });

    if (!parent) {
      throw new NotFoundException('Danh mục cha không tồn tại');
    }
    if (parent.type !== type) {
      throw new BadRequestException('Danh mục cha phải cùng loại chính');
    }
    if (parent.level !== CategoryLevel.GROUP) {
      throw new BadRequestException('Danh mục cha phải là cấp nhóm');
    }

    if (currentCategoryId) {
      let currentParent: Category | null = parent;
      while (currentParent) {
        if (currentParent.id === currentCategoryId) {
          throw new BadRequestException('Không thể tạo vòng lặp trong cây danh mục');
        }
        if (!currentParent.parentId) break;
        currentParent = await this.categoryRepository.findOne({
          where: { id: currentParent.parentId, familyId },
          relations: ['parent'],
        });
      }
    }

    return parent.id;
  }

  private validateCategoryShape(type?: CategoryType, level?: CategoryLevel) {
    if (!type || !level) {
      throw new BadRequestException('Loại danh mục và cấp danh mục là bắt buộc');
    }

    if (!Object.values(CategoryType).includes(type)) {
      throw new BadRequestException('Loại danh mục không hợp lệ');
    }

    if (!Object.values(CategoryLevel).includes(level)) {
      throw new BadRequestException('Cấp danh mục không hợp lệ');
    }
  }

  private async repairInvalidParentAssignments(familyId: string): Promise<void> {
    const categories = await this.categoryRepository.find({
      where: { familyId },
      relations: ['parent'],
      order: {
        isDefault: 'DESC',
        createdAt: 'ASC',
        name: 'ASC',
      },
    });

    const fallbackGroups = new Map<CategoryType, Category>();
    for (const type of Object.values(CategoryType)) {
      const existingGroup = categories.find((category) => category.type === type && category.level === CategoryLevel.GROUP);
      if (existingGroup) {
        fallbackGroups.set(type, existingGroup);
      }
    }

    for (const category of categories) {
      if (category.level !== CategoryLevel.CATEGORY) {
        continue;
      }

      const parent = category.parent;
      const hasInvalidParent = !parent
        || parent.type !== category.type
        || parent.level !== CategoryLevel.GROUP;

      if (!hasInvalidParent) {
        continue;
      }

      let fallbackGroup = fallbackGroups.get(category.type);
      if (!fallbackGroup) {
        fallbackGroup = await this.ensureDefaultGroup(familyId, category.type);
        fallbackGroups.set(category.type, fallbackGroup);
      }

      if (category.parentId === fallbackGroup.id) {
        continue;
      }

      await this.categoryRepository.update(
        { id: category.id, familyId },
        { parentId: fallbackGroup.id },
      );
    }
  }
}
