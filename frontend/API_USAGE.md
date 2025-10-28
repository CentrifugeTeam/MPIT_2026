# API Usage Guide

## 📁 Структура проекта (Feature Sliced Design)

```
src/
  features/
    auth/
      api/authApi.ts          # API функции
      hooks/                   # React Query хуки
        useLogin.ts
        useRegister.ts
        useLogout.ts
        useCurrentUser.ts
        useGetUserById.ts
        useGetAllUsers.ts
        useUpdateUser.ts
        useUpdateRole.ts
        index.ts               # Экспорт всех хуков
      types/auth.types.ts     # TypeScript типы
    notifications/
      api/notificationsApi.ts
      hooks/
        useCreateNotification.ts
        useGetNotifications.ts
        useSendNotification.ts
        useNotificationSettings.ts
        useUpdateNotificationSettings.ts
        index.ts
      types/notification.types.ts
  shared/
    api/axios.ts              # Axios instance с interceptors
    config/queryClient.ts     # React Query настройки
  store/
    userStore.ts              # Zustand store для пользователя
```

---

## ⚙️ Особенности реализации

### Получение данных пользователя

После логина автоматически делается запрос к `/api/auth/me` для получения актуальных данных пользователя:

- ✅ Не декодируем JWT на клиенте (безопаснее)
- ✅ Всегда актуальные данные с сервера
- ✅ Простое обновление данных при изменении роли

### Axios Interceptors

- **Request**: Автоматически добавляет `Authorization: Bearer {token}` к каждому запросу
- **Response**:
  - Автоматически обновляет токен если он есть в ответе
  - Автоматически выполняет logout при 401 ошибке
  - Логирует все ошибки в консоль **на русском языке**

### React Query настройки

- **retry**: 2 попытки для queries, 1 для mutations
- **staleTime**: 0 (данные сразу устаревают)
- **refetchOnWindowFocus**: false
- **refetchOnReconnect**: true

### Zustand Persist

- Пользователь и токен автоматически сохраняются в localStorage
- Ключ: `user-storage`

---
