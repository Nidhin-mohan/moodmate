import type { UserRole } from './auth';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isPro: boolean;
  proSince: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole | '';
  isPro?: boolean | undefined;
  proSinceFrom?: string;
  proSinceTo?: string;
  includeDeleted?: boolean;
}

export interface ListUsersResponse {
  success: boolean;
  data: AdminUser[];
  total: number;
  page: number;
  pages: number;
}

export interface UpdateUserPayload {
  role?: UserRole;
  isPro?: boolean;
  name?: string;
}

export interface UpdateUserResponse {
  success: boolean;
  data: AdminUser;
}

export interface DeleteUserResponse {
  success: boolean;
  data: AdminUser;
}
