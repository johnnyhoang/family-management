import api from './client';

export interface Family {
  id: string;
  name: string;
  status: string;
  createdAt?: string;
}

export const familyApi = {
  getMyFamily: () => api.get<Family>('/family'),
  updateMyFamily: (data: { name?: string }) => api.patch<Family>('/family', data),
};
