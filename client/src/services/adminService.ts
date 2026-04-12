import api from "@/api";
import { AxiosError } from "axios";
import type {
  DeleteUserResponse,
  ListUsersParams,
  ListUsersResponse,
  UpdateUserPayload,
  UpdateUserResponse,
} from "@/types/admin";

export const listUsers = async (
  params: ListUsersParams = {}
): Promise<ListUsersResponse> => {
  try {
    // Strip undefined / empty-string values so they don't pollute the query string
    const query: Record<string, string | number | boolean> = {};
    if (params.page != null) query.page = params.page;
    if (params.limit != null) query.limit = params.limit;
    if (params.search) query.search = params.search;
    if (params.role) query.role = params.role;
    if (params.isPro != null) query.isPro = params.isPro;
    if (params.proSinceFrom) query.proSinceFrom = params.proSinceFrom;
    if (params.proSinceTo) query.proSinceTo = params.proSinceTo;
    if (params.includeDeleted) query.includeDeleted = params.includeDeleted;

    const response = await api.get<ListUsersResponse>("/admin/users", {
      params: query,
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    throw new Error(
      axiosError.response?.data?.message ?? "Failed to fetch users. Please try again."
    );
  }
};

export const updateUser = async (
  id: string,
  data: UpdateUserPayload
): Promise<UpdateUserResponse> => {
  try {
    const response = await api.patch<UpdateUserResponse>(`/admin/users/${id}`, data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    throw new Error(
      axiosError.response?.data?.message ?? "Failed to update user. Please try again."
    );
  }
};

export const deleteUser = async (id: string): Promise<DeleteUserResponse> => {
  try {
    const response = await api.delete<DeleteUserResponse>(`/admin/users/${id}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    throw new Error(
      axiosError.response?.data?.message ?? "Failed to delete user. Please try again."
    );
  }
};
