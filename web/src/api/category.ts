import api from './client';

export type CategoryType = 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE';
export type CategoryLevel = 'GROUP' | 'CATEGORY';
export type ExpenseEntryType = 'INCOME' | 'EXPENSE' | 'LIABILITY';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  level: CategoryLevel;
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

export const categoryLevelLabels: Record<CategoryLevel, string> = {
  GROUP: 'Nhóm',
  CATEGORY: 'Danh mục',
};

export const expenseEntryTypeLabels: Record<ExpenseEntryType, string> = {
  INCOME: 'Thu nhập',
  EXPENSE: 'Chi phí',
  LIABILITY: 'Nợ',
};

export const isLeafCategory = (category?: Pick<Category, 'level'> | null) => category?.level === 'CATEGORY';

export const isAssetCategory = (category?: Pick<Category, 'type' | 'level'> | null) =>
  category?.type === 'ASSET' && category.level === 'CATEGORY';

export const supportsExpenseEntryType = (
  category: Pick<Category, 'type' | 'level'> | null | undefined,
  entryType: ExpenseEntryType,
) => category?.level === 'CATEGORY' && category.type === entryType;

export const isTransferCategory = (
  category: Pick<Category, 'type' | 'level'> | null | undefined,
) => category?.level === 'CATEGORY' && (category.type === 'ASSET' || category.type === 'LIABILITY');

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
