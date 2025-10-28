import apiClient from "@/shared/api/axios";
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  UserResponse,
  UpdateUserRequest,
  UpdateRoleRequest,
  TokenResponse,
  UserListResponse,
} from "../types/auth.types";

const AUTH_BASE_URL = "/auth";

/**
 * Регистрация нового пользователя
 */
export const registerUser = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>(
    `${AUTH_BASE_URL}/create`,
    data
  );
  return response.data;
};

/**
 * Вход в систему
 */
export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>(
    `${AUTH_BASE_URL}/login`,
    data
  );
  return response.data;
};

/**
 * Получить данные текущего пользователя
 */
export const getCurrentUser = async (): Promise<UserResponse> => {
  const response = await apiClient.get<UserResponse>(`${AUTH_BASE_URL}/me`);
  return response.data;
};

/**
 * Получить пользователя по UUID
 */
export const getUserById = async (userId: string): Promise<UserResponse> => {
  const response = await apiClient.get<UserResponse>(
    `${AUTH_BASE_URL}/user/${userId}`
  );
  return response.data;
};

/**
 * Получить всех пользователей (только для ADMIN)
 */
export const getAllUsers = async (): Promise<UserListResponse> => {
  const response = await apiClient.get<UserListResponse>(
    `${AUTH_BASE_URL}/users`
  );
  return response.data;
};

/**
 * Обновить данные текущего пользователя
 */
export const updateCurrentUser = async (
  data: UpdateUserRequest
): Promise<UserResponse> => {
  const response = await apiClient.post<UserResponse>(
    `${AUTH_BASE_URL}/me`,
    data
  );
  return response.data;
};

/**
 * Изменить роль пользователя (только для ADMIN)
 */
export const updateUserRole = async (
  userId: string,
  data: UpdateRoleRequest
): Promise<TokenResponse> => {
  const response = await apiClient.put<TokenResponse>(
    `${AUTH_BASE_URL}/user/${userId}/role`,
    data
  );
  return response.data;
};

/**
 * Обновить access token используя refresh token
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>(
    `${AUTH_BASE_URL}/refresh`,
    { refresh_token: refreshToken }
  );
  return response.data;
};
