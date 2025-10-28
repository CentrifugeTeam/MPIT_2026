// Типы для запросов
export interface RegisterRequest {
  email: string;
  password: string;
  confirm_password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
}

export interface UpdateRoleRequest {
  role: "USER" | "ADMIN";
}

// Типы для ответов
export interface UserResponse {
  uuid: string;
  email: string;
  role?: "USER" | "ADMIN";
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_uuid: string;
}

export interface RegisterResponse {
  message: string;
  uuid: string;
}

export interface UserListResponse {
  users: UserResponse[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_uuid: string;
}
