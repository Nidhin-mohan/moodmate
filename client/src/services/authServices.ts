import api from "@/api";
import {
  LoginCredentials,
  SignupData,
  Profile,
  AuthResponse,
} from "../types/auth";
import { AxiosError } from "axios";

export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", credentials);
  return response.data;
};

export const signup = async (userData: SignupData): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>("/auth/register", userData);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>

    // Extracting error message from response if available, otherwise fallback
    const errorMessage =
      axiosError.response?.data?.message ||
      "Registration failed. Please try again.";

    throw new Error(errorMessage);
  }
};

export const getProfile = async (): Promise<Profile> => {
  const response = await api.get<Profile>("/profile");
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post("/logout");
};
