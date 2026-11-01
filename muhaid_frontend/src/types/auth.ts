import type { Role } from './api';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: CurrentUser;
}
