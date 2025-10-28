import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // Повторять запрос 2 раза при ошибке
      staleTime: 0, // Данные сразу считаются устаревшими
      refetchOnWindowFocus: false, // Не обновлять при фокусе на окне
      refetchOnReconnect: true, // Обновлять при восстановлении соединения
    },
    mutations: {
      retry: 1, // Повторять мутацию 1 раз при ошибке
    },
  },
});
