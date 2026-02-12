import api from './client';

export interface Asset {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: { name: string };
  purchasePrice: number;
  currentValue: number;
  status: string;
  purchaseDate?: string;
  warrantyExpiredAt?: string;
}

export const assetApi = {
  findAll: (params?: any) => api.get<Asset[]>('/assets', { params }),
  findOne: (id: string) => api.get<Asset>(`/assets/${id}`),
  create: (data: Partial<Asset>) => api.post<Asset>('/assets', data),
  update: (id: string, data: Partial<Asset>) => api.put<Asset>(`/assets/${id}`, data),
  delete: (id: string) => api.delete(`/assets/${id}`),
  export: (params?: any) => api.get('/assets/export', { params, responseType: 'blob' }),
};
