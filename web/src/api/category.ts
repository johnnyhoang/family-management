import api from './client';

export interface Category {
  id: string;
  name: string;
  type: 'ASSET' | 'EXPENSE' | 'INCOME';
  parentId?: string;
}

export const categoryApi = {
  findAll: () => api.get<Category[]>('/categories'),
  create: (data: Partial<Category>) => api.post<Category>('/categories', data),
  update: (id: string, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};
