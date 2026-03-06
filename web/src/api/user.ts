import api from './client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
}

export const userApi = {
  findAll: () => api.get<User[]>('/users'),
  invite: (email: string, role: string, fullName?: string) => api.post('/users/invite', { email, role, fullName }),
  updateRole: (id: string, role: string) => api.put(`/users/${id}/role`, { role }),
  remove: (id: string) => api.delete(`/users/${id}`),
};
