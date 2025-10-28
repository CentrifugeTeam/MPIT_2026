import { Routes, Route, Navigate } from "react-router-dom";
import {
  LoginPage,
  RegisterPage,
  DashboardPage,
  HomePage,
  AllProjectsPage,
  DraftsPage,
  DeletedPage,
  CreateProjectPage,
  EditProjectPage,
  ProjectViewPage,
} from "./pages";
import ProtectedRoute from "./shared/components/ProtectedRoute";
import { isLocalMode } from "./shared/config/env";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

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
