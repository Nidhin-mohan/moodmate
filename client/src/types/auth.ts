export type UserRole = 'admin' | 'user' | 'therapist';

// Core user shape — source of truth used by AuthContext, services, and components.
export interface User {
  userId: string;
  _id: string;
  name: string;
  email: string;
  role?: UserRole;
  isPro?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface Profile {
  name: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    _id: string;
    name: string;
    email: string;
    role?: UserRole;
    isPro?: boolean;
    token: string;
  };
}
