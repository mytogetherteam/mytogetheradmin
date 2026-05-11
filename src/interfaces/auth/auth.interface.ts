export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  refreshToken: string;
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  authorities: string[];
}

export type RegisterResponse = LoginResponse;

export interface UserData {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  authorities: string[];
}
