import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category, CategoryType } from '../../common/entities/category.entity';

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
          parentId: null,
          isDefault: true,
        });

        for (const categoryName of groupDef.categories) {
          await this.findOrCreateCategory(familyId, {
            name: categoryName,
            type: typeDef.type,
            parentId: group.id,
            isDefault: true,
          });
        }
      }
    }
  }

  async create(familyId: string, data: Partial<Category>) {
    const type = data.type;
    if (!type) throw new BadRequestException('Loại danh mục là bắt buộc');

    // parentId === null  → explicitly creating a root/group
    // parentId === undefined/missing → auto-assign leaf to default group (quick-add convenience)
    // parentId === <id> → leaf with explicit parent
    let parentId: string | null;
    if (data.parentId === null) {
      parentId = null;
    } else if (data.parentId) {
      parentId = await this.validateParent(familyId, type, data.parentId);
    } else {
      const defaultGroup = await this.ensureDefaultGroup(familyId, type);
      parentId = defaultGroup.id;
    }

    const category = this.categoryRepository.create({ ...data, familyId, parentId });
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
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');

    const nextType = data.type ?? category.type;
    const nextParentId = 'parentId' in data ? (data.parentId ?? null) : category.parentId;

    // A category with children is a group — cannot receive a parent
    if (nextParentId !== null && (category.children?.length ?? 0) > 0) {
      throw new BadRequestException('Danh mục đang có danh mục con, không thể thêm danh mục cha');
    }

    const resolvedParentId = nextParentId
      ? await this.validateParent(familyId, nextType, nextParentId, id)
      : null;

    await this.categoryRepository.update(
      { id, familyId },
      {
        name: data.name !== undefined ? data.name : category.name,
        isDefault: data.isDefault !== undefined ? data.isDefault : category.isDefault,
        type: nextType,
        parentId: resolvedParentId,
        ...(data.updatedBy !== undefined ? { updatedBy: data.updatedBy } : {}),
      },
    );

    // Cascade type change to children when root type changes
    if (nextType !== category.type && resolvedParentId === null) {
      await this.categoryRepository.update({ familyId, parentId: id }, { type: nextType });
    }

    return this.findOne(id, familyId);
  }

  async delete(id: string, familyId: string) {
    const category = await this.findOne(id, familyId);
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    return this.categoryRepository.softRemove(category);
  }

  async ensureDefaultGroup(familyId: string, type: CategoryType): Promise<Category> {
    return this.findOrCreateCategory(familyId, {
      name: DEFAULT_GROUP_NAMES[type],
      type,
      parentId: null,
      isDefault: true,
    });
  }

  private async findOrCreateCategory(familyId: string, data: Partial<Category>): Promise<Category> {
    const existing = await this.categoryRepository.findOne({
      where: {
        familyId,
        name: data.name,
        type: data.type,
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

  private async validateParent(
    familyId: string,
    type: CategoryType,
    parentId: string,
    currentCategoryId?: string,
  ): Promise<string> {
    if (currentCategoryId && parentId === currentCategoryId) {
      throw new BadRequestException('Danh mục không thể tự làm danh mục cha');
    }

    const parent = await this.categoryRepository.findOne({
      where: { id: parentId, familyId },
    });

    if (!parent) throw new NotFoundException('Danh mục cha không tồn tại');
    if (parent.type !== type) throw new BadRequestException('Danh mục cha phải cùng loại chính');
    if (parent.parentId !== null) throw new BadRequestException('Danh mục cha phải là danh mục gốc (không có cha)');

    return parent.id;
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
      const existingGroup = categories.find((c) => c.type === type && c.parentId === null);
      if (existingGroup) fallbackGroups.set(type, existingGroup);
    }

    for (const category of categories) {
      if (category.parentId === null) continue;

      const parent = category.parent;
      const hasInvalidParent = !parent
        || parent.type !== category.type
        || parent.parentId !== null;

      if (!hasInvalidParent) continue;

      let fallbackGroup = fallbackGroups.get(category.type);
      if (!fallbackGroup) {
        fallbackGroup = await this.ensureDefaultGroup(familyId, category.type);
        fallbackGroups.set(category.type, fallbackGroup);
      }

      if (category.parentId === fallbackGroup.id) continue;

      await this.categoryRepository.update(
        { id: category.id, familyId },
        { parentId: fallbackGroup.id },
      );
    }
  }
}
