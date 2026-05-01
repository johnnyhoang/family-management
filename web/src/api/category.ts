import api from './client';

export type CategoryType = 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE';
export type ExpenseEntryType = 'INCOME' | 'EXPENSE' | 'LIABILITY';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  parentId?: string | null;
  parent?: Pick<Category, 'id' | 'name'> | null;
  children?: Category[];
  isDefault?: boolean;
}

export const categoryTypeLabels: Record<CategoryType, string> = {
  ASSET: 'Tài sản',
  LIABILITY: 'Nợ phải trả',
  INCOME: 'Thu nhập',
  EXPENSE: 'Chi phí',
};

export const expenseEntryTypeLabels: Record<ExpenseEntryType, string> = {
  INCOME: 'Thu nhập',
  EXPENSE: 'Chi phí',
  LIABILITY: 'Nợ',
};

const buildChildrenByParent = (categories: Category[] = []) => {
  const childrenByParent = new Map<string, string[]>();

  categories.forEach((category) => {
    if (!category.parentId) return;

    const children = childrenByParent.get(category.parentId) ?? [];
    children.push(category.id);
    childrenByParent.set(category.parentId, children);
  });

  return childrenByParent;
};

export const isLeafCategory = (
  category: Pick<Category, 'id'> | null | undefined,
  categories: Category[] = [],
) => {
  if (!category) return false;
  return !categories.some((item) => item.parentId === category.id);
};

export const isAssetCategory = (
  category: Pick<Category, 'type'> | null | undefined,
) => category?.type === 'ASSET';

export const supportsExpenseEntryType = (
  category: Pick<Category, 'type'> | null | undefined,
  entryType: ExpenseEntryType,
) => category?.type === entryType;

export const isTransferCategory = (
  category: Pick<Category, 'type'> | null | undefined,
) => category?.type === 'ASSET' || category?.type === 'LIABILITY';

export const getCategoryDepth = (
  categories: Category[] = [],
  categoryId?: string | null,
): number => {
  if (!categoryId) return 0;

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const visited = new Set<string>();
  let depth = 0;
  let current = categoryMap.get(categoryId);

  while (current?.parentId) {
    if (visited.has(current.id)) {
      return depth + 1;
    }

    visited.add(current.id);
    const parent = categoryMap.get(current.parentId);
    if (!parent) {
      return depth + 1;
    }

    depth += 1;
    current = parent;
  }

  return depth;
};

export const getCategorySubtreeHeight = (
  categories: Category[] = [],
  categoryId?: string | null,
): number => {
  if (!categoryId) return 0;

  const childrenByParent = buildChildrenByParent(categories);
  const visit = (currentId: string): number => {
    const childIds = childrenByParent.get(currentId) ?? [];
    if (!childIds.length) {
      return 0;
    }

    return 1 + Math.max(...childIds.map((childId) => visit(childId)));
  };

  return visit(categoryId);
};

export const buildCategoryPathLabel = (
  categories: Category[] = [],
  categoryId?: string | null,
): string => {
  if (!categoryId) return '';

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const labels: string[] = [];
  const visited = new Set<string>();
  let current = categoryMap.get(categoryId);

  while (current && !visited.has(current.id)) {
    labels.unshift(current.name);
    visited.add(current.id);
    current = current.parentId ? categoryMap.get(current.parentId) : undefined;
  }

  return labels.join(' / ');
};

export const categoryApi = {
  findAll: () => api.get<Category[]>('/categories'),
  create: (data: Partial<Category>) => api.post<Category>('/categories', data),
  update: (id: string, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};
