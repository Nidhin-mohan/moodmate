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
  data: UserData;
}

interface UserData {
  userId: string;
  name: string;
  email: string;
  token: string;
}

