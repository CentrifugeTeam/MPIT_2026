// Конфигурация окружения
export const isLocalMode = import.meta.env.VITE_BACKEND_LOCAL === 'true';

// Локальные настройки
export const LOCAL_CONFIG = {
  // Захардкоженный токен для локального режима
  HARDCODED_TOKEN: 'local-hardcoded-token',
  HARDCODED_REFRESH_TOKEN: 'local-hardcoded-refresh-token',

  // Локальный пользователь
  LOCAL_USER: {
    uuid: 'local-user-uuid',
    email: 'local@user.com',
    role: 'ADMIN' as const,
    name: 'Локальный пользователь',
  },

  // URL для локального режима (прямо к BFF)
  API_BASE_URL: 'http://localhost:8000/api',
};

// Настройки для облачного режима
export const CLOUD_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.example.com',
};

// Текущая конфигурация
export const CONFIG = isLocalMode ? LOCAL_CONFIG : CLOUD_CONFIG;
