import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category, CategoryType } from '../../common/entities/category.entity';

const MAX_CATEGORY_DEPTH = 1;

const DEFAULT_CATEGORY_TREE: Array<{
  type: CategoryType;
  roots: Array<{ name: string; children: string[] }>;
}> = [
  {
    type: CategoryType.ASSET,
    roots: [
      { name: 'Thanh khoản', children: ['Tiền mặt', 'Tài khoản ngân hàng'] },
      { name: 'Đầu tư', children: ['Cổ phiếu', 'Crypto'] },
      { name: 'Tài sản dài hạn', children: ['Nhà đất', 'Xe cộ'] },
    ],
  },
  {
    type: CategoryType.LIABILITY,
    roots: [
      { name: 'Công nợ', children: ['Khoản vay', 'Thẻ tín dụng'] },
    ],
  },
  {
    type: CategoryType.INCOME,
    roots: [
      { name: 'Thu nhập chính', children: ['Lương / Thu nhập chính'] },
      { name: 'Thu nhập khác', children: ['Thưởng, quà, hoàn tiền', 'Lãi đầu tư, cổ tức'] },
    ],
  },
  {
    type: CategoryType.EXPENSE,
    roots: [
      { name: 'Sinh hoạt', children: ['Ăn uống', 'Đi lại', 'Hóa đơn'] },
    ],
  },
];

type CategoryShape = Pick<Category, 'id' | 'type' | 'parentId'>;

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
      for (const rootDef of typeDef.roots) {
        const rootCategory = await this.findOrCreateCategory(familyId, {
          name: rootDef.name,
          type: typeDef.type,
          isDefault: true,
        });

        for (const childName of rootDef.children) {
          await this.findOrCreateCategory(familyId, {
            name: childName,
            type: typeDef.type,
            parentId: rootCategory.id,
            isDefault: true,
          });
        }
      }
    }
  }

  async create(familyId: string, data: Partial<Category>) {
    this.validateCategoryType(data.type);

    const parentId = await this.resolveParentId(
      familyId,
      data.type,
      data.parentId ?? null,
    );

    const category = this.categoryRepository.create({
      name: data.name,
      type: data.type,
      isDefault: data.isDefault ?? false,
      familyId,
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
    this.validateCategoryType(nextType);

    if (nextType !== category.type && category.children?.length) {
      throw new BadRequestException('Danh mục đang có danh mục con, chưa thể đổi loại chính');
    }

    const nextParentId = await this.resolveParentId(
      familyId,
      nextType,
      data.parentId ?? category.parentId ?? null,
      id,
    );

    await this.categoryRepository.update(
      { id, familyId },
      {
        name: data.name !== undefined ? data.name : category.name,
        isDefault: data.isDefault !== undefined ? data.isDefault : category.isDefault,
        type: nextType,
        parentId: nextParentId,
        ...(data.updatedBy !== undefined ? { updatedBy: data.updatedBy } : {}),
      },
    );

    return this.findOne(id, familyId);
  }

  async delete(id: string, familyId: string) {
    const category = await this.findOne(id, familyId);
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    if (category.children?.length) {
      throw new BadRequestException('Danh mục đang có danh mục con, không thể xóa');
    }

    return this.categoryRepository.softRemove(category);
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

    if (existing) {
      return existing;
    }

    const category = this.categoryRepository.create({
      name: data.name,
      type: data.type,
      isDefault: data.isDefault ?? false,
      familyId,
      parentId: data.parentId ?? null,
    });

    return this.categoryRepository.save(category);
  }

  private async resolveParentId(
    familyId: string,
    type: CategoryType | undefined,
    parentId: string | null,
    currentCategoryId?: string,
  ): Promise<string | null> {
    this.validateCategoryType(type);

    if (!parentId) {
      return null;
    }

    if (currentCategoryId && parentId === currentCategoryId) {
      throw new BadRequestException('Danh mục không thể tự làm danh mục cha');
    }

    const categories = await this.categoryRepository.find({
      where: { familyId },
      select: ['id', 'type', 'parentId'],
    });
    const categoryMap = new Map(categories.map((category) => [category.id, category]));
    const childrenByParent = this.buildChildrenByParent(categories);

    const parent = categoryMap.get(parentId);
    if (!parent) {
      throw new NotFoundException('Danh mục cha không tồn tại');
    }

    if (parent.type !== type) {
      throw new BadRequestException('Danh mục cha phải cùng loại chính');
    }

    if (currentCategoryId && this.isDescendant(parent.id, currentCategoryId, childrenByParent)) {
      throw new BadRequestException('Không thể tạo vòng lặp trong cây danh mục');
    }

    const parentDepth = this.getDepth(parent.id, categoryMap);
    const movingSubtreeHeight = currentCategoryId
      ? this.getSubtreeHeight(currentCategoryId, childrenByParent)
      : 0;

    if (parentDepth + 1 + movingSubtreeHeight > MAX_CATEGORY_DEPTH) {
      throw new BadRequestException('Cây danh mục chỉ hỗ trợ tối đa 2 cấp');
    }

    return parent.id;
  }

  private validateCategoryType(type?: CategoryType) {
    if (!type) {
      throw new BadRequestException('Loại danh mục là bắt buộc');
    }

    if (!Object.values(CategoryType).includes(type)) {
      throw new BadRequestException('Loại danh mục không hợp lệ');
    }
  }

  private buildChildrenByParent(categories: CategoryShape[]): Map<string, string[]> {
    const childrenByParent = new Map<string, string[]>();

    for (const category of categories) {
      if (!category.parentId) {
        continue;
      }

      const children = childrenByParent.get(category.parentId) ?? [];
      children.push(category.id);
      childrenByParent.set(category.parentId, children);
    }

    return childrenByParent;
  }

  private getDepth(categoryId: string, categoryMap: Map<string, CategoryShape>): number {
    const visited = new Set<string>();
    let depth = 0;
    let current = categoryMap.get(categoryId);

    while (current?.parentId) {
      if (visited.has(current.id)) {
        return MAX_CATEGORY_DEPTH + 1;
      }

      visited.add(current.id);
      const parent = categoryMap.get(current.parentId);
      if (!parent) {
        return MAX_CATEGORY_DEPTH + 1;
      }

      depth += 1;
      current = parent;
    }

    return depth;
  }

  private getSubtreeHeight(categoryId: string, childrenByParent: Map<string, string[]>): number {
    const children = childrenByParent.get(categoryId) ?? [];
    if (!children.length) {
      return 0;
    }

    return 1 + Math.max(...children.map((childId) => this.getSubtreeHeight(childId, childrenByParent)));
  }

  private isDescendant(candidateId: string, ancestorId: string, childrenByParent: Map<string, string[]>): boolean {
    const stack = [...(childrenByParent.get(ancestorId) ?? [])];
    const visited = new Set<string>();

    while (stack.length) {
      const currentId = stack.pop()!;
      if (visited.has(currentId)) {
        continue;
      }

      if (currentId === candidateId) {
        return true;
      }

      visited.add(currentId);
      stack.push(...(childrenByParent.get(currentId) ?? []));
    }

    return false;
  }

  private async repairInvalidParentAssignments(familyId: string): Promise<void> {
    const categories = await this.categoryRepository.find({
      where: { familyId },
      order: {
        createdAt: 'ASC',
        name: 'ASC',
      },
    });

    const categoryMap = new Map(categories.map((category) => [category.id, category]));

    for (const category of categories) {
      const nextParentId = this.resolveSafeParentId(category, categoryMap);

      if (nextParentId === category.parentId) {
        continue;
      }

      await this.categoryRepository.update(
        { id: category.id, familyId },
        { parentId: nextParentId },
      );

      category.parentId = nextParentId;
      categoryMap.set(category.id, category);
    }
  }

  private resolveSafeParentId(
    category: CategoryShape,
    categoryMap: Map<string, CategoryShape>,
  ): string | null {
    if (!category.parentId) {
      return null;
    }

    const parent = categoryMap.get(category.parentId);
    if (!parent || parent.type !== category.type || parent.id === category.id) {
      return null;
    }

    let current: CategoryShape | undefined = category;
    let depth = 0;
    const visited = new Set<string>();

    while (current?.parentId) {
      if (visited.has(current.id)) {
        return null;
      }

      visited.add(current.id);
      const nextParent = categoryMap.get(current.parentId);
      if (!nextParent || nextParent.type !== category.type) {
        return null;
      }

      depth += 1;
      if (depth > MAX_CATEGORY_DEPTH) {
        return null;
      }

      current = nextParent;
    }

    return category.parentId;
  }
}
