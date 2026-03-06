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
  createdBy?: string;
  creator?: { fullName: string; email: string };
  updatedBy?: string;
  updater?: { fullName: string; email: string };
  createdAt?: string;
  updatedAt?: string;
}

export const expenseApi = {
  findAll: (params?: any) => api.get<Expense[]>('/expenses', { params }),
  create: (data: Partial<Expense>) => api.post<Expense>('/expenses', data),
  update: (id: string, data: Partial<Expense>) => api.put<Expense>(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  export: (params?: any) => api.get('/expenses/export', { params, responseType: 'blob' }),
};
