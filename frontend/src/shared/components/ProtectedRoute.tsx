import { Navigate } from "react-router-dom";
import { useUserStore } from "@/store/userStore";
import { isLocalMode } from "@/shared/config/env";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, initializeLocalUser } = useUserStore();

  // В локальном режиме автоматически инициализируем пользователя
  useEffect(() => {
    if (isLocalMode && !isAuthenticated) {
      initializeLocalUser();
    }
  }, [isAuthenticated, initializeLocalUser]);

  // В локальном режиме всегда разрешаем доступ
  if (isLocalMode) {
    return <>{children}</>;
  }

  // В облачном режиме проверяем аутентификацию
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
