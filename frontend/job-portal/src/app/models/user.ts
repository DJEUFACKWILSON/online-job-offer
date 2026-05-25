export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'recruiter' | 'seeker';
  profile_picture?: string;
  phone?: string;
  location?: string;
  bio?: string;
  company_name?: string;
  is_verified: boolean;
  is_active: boolean;
  date_joined: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  totp_code?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  password2: string;
  role: string;
  phone?: string;
  location?: string;
  company_name?: string;
  admin_key?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}