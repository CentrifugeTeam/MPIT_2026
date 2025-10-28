import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useUserStore } from "@/store/userStore";
import { useToastStore } from "@/shared/hooks/useToast";
import i18n from "i18next";

const CLOUD_URL = (import.meta.env.VITE_API_BASE_URL ||
  "https://affectedly-optimistic-turkey.cloudpub.ru") + "/api";
const LOCAL_URL = "http://localhost:8000/api";

let BASE_URL = import.meta.env.VITE_BACKEND_LOCAL === "true" ? LOCAL_URL : CLOUD_URL;
let isUsingLocalFallback = false;

// Debug logs
console.log("🔧 VITE_BACKEND_LOCAL:", import.meta.env.VITE_BACKEND_LOCAL);
console.log("🔧 Режим:", import.meta.env.VITE_BACKEND_LOCAL === "true" ? "ЛОКАЛЬНЫЙ" : "ОБЛАЧНЫЙ");
console.log("🔧 Первоначальный API URL:", BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

const getErrorMessage = (status?: number, defaultMessage?: string): string => {
  if (!status) {
    return i18n.t("errors.api.networkError");
  }

  const statusKey = `errors.api.${status}`;
  if (i18n.exists(statusKey)) {
    return i18n.t(statusKey);
  }

  if (status >= 500) {
    return i18n.t("errors.api.serverError");
  } else if (status >= 400) {
    return i18n.t("errors.api.badRequest");
  }

  return defaultMessage || i18n.t("errors.api.unknown");
};

const showErrorToast = (error: AxiosError) => {
  const { addToast } = useToastStore.getState();
  const status = error.response?.status;
  const url = error.config?.url || "";

  if (url.includes("/auth/refresh")) {
    return;
  }

  const serverMessage =
    (error.response?.data as { detail?: string, message?: string })?.detail ||
    (error.response?.data as { detail?: string, message?: string })?.message;

  const title = i18n.t("errors.api.title");
  const message = serverMessage || getErrorMessage(status, error.message);

  addToast({
    type: "error",
    title,
    message,
    duration: 6000,
  });
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useUserStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("Ошибка перехватчика запроса:", error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    if (response.data?.access_token && response.data?.refresh_token) {
      const { setTokens } = useUserStore.getState();
      setTokens(response.data.access_token, response.data.refresh_token);
      console.log("Токены обновлены из ответа");
    }

    return response;
  },
  async (error: AxiosError) => {
    if (
      !error.response &&
      (error.code === "ERR_NETWORK" || error.code === "ECONNABORTED") &&
      !isUsingLocalFallback &&
      BASE_URL === CLOUD_URL
    ) {
      console.warn("⚠️ Облачный сервер недоступен, пробуем localhost...");

      try {
        const testResponse = await axios.get(`${LOCAL_URL}/health`, {
          timeout: 3000,
        }).catch(() => null);

        if (testResponse) {
          BASE_URL = LOCAL_URL;
          apiClient.defaults.baseURL = LOCAL_URL;
          isUsingLocalFallback = true;

          const { addToast } = useToastStore.getState();
          addToast({
            type: "info",
            title: i18n.t("common.localMode") || "Локальный режим",
            message: "Облачный сервер недоступен. Подключение к локальному серверу.",
            duration: 5000,
          });

          return apiClient(error.config!);
        }
      } catch {
        console.warn("❌ Localhost тоже недоступен");
      }
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // В локальном режиме не пытаемся обновлять токены при 401
    const isLocal = import.meta.env.VITE_BACKEND_LOCAL === "true";

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh" &&
      !isLocal // Пропускаем refresh в локальном режиме
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken } = useUserStore.getState();

      if (!refreshToken) {
        const { clearAuth } = useUserStore.getState();
        clearAuth();
        console.error("401 Неавторизован - нет refresh токена");
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const { access_token, refresh_token } = response.data;

        const { setTokens } = useUserStore.getState();
        setTokens(access_token, refresh_token);

        console.log("✅ Токены успешно обновлены");

        processQueue();
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        isRefreshing = false;

        const { clearAuth } = useUserStore.getState();
        clearAuth();
        console.error("❌ Не удалось обновить токены - пользователь вышел");
        return Promise.reject(refreshError);
      }
    }

    console.error("Ошибка API:", {
      статус: error.response?.status,
      сообщение: error.message,
      данные: error.response?.data,
      url: error.config?.url,
    });

    showErrorToast(error);

    return Promise.reject(error);
  }
);

export default apiClient;
