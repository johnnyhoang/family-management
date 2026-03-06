import api from './client';
import type { Category } from './category';

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  type: string;
  expenseDate: string;
  isRecurring: boolean;
  recurringCycle?: string;
  note?: string;
  assetId?: string;
  asset?: { name: string };
  category?: Category;
}

export const expenseApi = {
  findAll: (params?: any) => api.get<Expense[]>('/expenses', { params }),
  create: (data: Partial<Expense>) => api.post<Expense>('/expenses', data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  export: (params?: any) => api.get('/expenses/export', { params, responseType: 'blob' }),
};
