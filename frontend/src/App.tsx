import { Routes, Route, Navigate } from "react-router-dom";
import {
  LoginPage,
  RegisterPage,
  DashboardPage,
  OnboardingPage,
  AllProjectsPage,
  DraftsPage,
  DeletedPage,
  CreateProjectPage,
  EditProjectPage,
  ProjectViewPage,
} from "./pages";
import ProtectedRoute from "./shared/components/ProtectedRoute";
import { isLocalMode } from "./shared/config/env";
import { useCurrentUser } from "./features/auth/hooks";

export default function App() {
  // Автоматическая загрузка данных пользователя при авторизации
  useCurrentUser();

  // Проверяем, был ли просмотрен онбординг
  const isOnboardingCompleted =
    localStorage.getItem("onboarding_completed") === "true";

  return (
    <Routes>
      {/* Главная страница: онбординг или логин/дашборд в зависимости от режима */}
      <Route
        path="/"
        element={
          isOnboardingCompleted ? (
            <Navigate to={isLocalMode ? "/dashboard" : "/login"} replace />
          ) : (
            <OnboardingPage />
          )
        }
      />

      {/* Онбординг доступен всегда для повторного просмотра */}
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Страницы аутентификации только в облачном режиме */}
      {!isLocalMode && (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </>
      )}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard/all" replace />} />
        <Route path="all" element={<AllProjectsPage />} />
        <Route path="drafts" element={<DraftsPage />} />
        <Route path="deleted" element={<DeletedPage />} />
        <Route path="create" element={<CreateProjectPage />} />
        <Route path="projects/:projectId" element={<ProjectViewPage />} />
        <Route path="projects/:projectId/edit" element={<EditProjectPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
