import api from './client';

export type SystemRole = 'USER' | 'APP_ADMIN';
export type FamilyRole = 'APP_ADMIN' | 'FAMILY_ADMIN' | 'MEMBER' | null;

export interface SessionMembership {
  familyId: string;
  familyName: string;
  role: Exclude<FamilyRole, null>;
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl?: string | null;
  otherNames?: string | null;
  systemRole: SystemRole;
  role: FamilyRole;
  familyId: string | null;
  memberships: SessionMembership[];
}

export interface SessionResponse {
  access_token: string;
  user: SessionUser;
}

export const authApi = {
  me: () => api.get<SessionResponse>('/auth/me'),
  listFamilies: () => api.get<Array<{ familyId: string; familyName: string; role: FamilyRole; status: string }>>('/auth/families'),
  switchFamily: (familyId: string) => api.post<SessionResponse>('/auth/switch-family', { familyId }),
  acceptInvite: (token: string) => api.post<SessionResponse>('/auth/accept-invite', { token }),
};
