import api from './client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  otherNames?: string;
  role: string;
  status: string;
  createdBy?: string;
  creator?: { fullName: string; email: string };
  updatedBy?: string;
  updater?: { fullName: string; email: string };
  createdAt?: string;
  updatedAt?: string;
}

export const userApi = {
  findAll: () => api.get<User[]>('/users'),
  invite: (email: string, role: string, fullName?: string) => api.post('/users/invite', { email, role, fullName }),
  update: (id: string, data: Partial<User>) => api.patch(`/users/${id}`, data),
  updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role }),
  remove: (id: string) => api.delete(`/users/${id}`),
};
