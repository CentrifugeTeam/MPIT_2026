import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
// import ThemeSwitch from "@/shared/components/ThemeSwitch";
// import LanguageSwitch from "@/shared/components/LanguageSwitch";
import { useUserStore } from "@/store/userStore";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { isLocalMode } from "@/shared/config/env";
import { useEffect } from "react";

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const handleLogout = useLogout();

  // В локальном режиме автоматически перенаправляем на dashboard
  useEffect(() => {
    if (isLocalMode && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLocalMode, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <nav className="border-b border-divider">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h2 className="text-xl font-bold">мёрджер</h2>
            </div>
            <div className="flex items-center gap-4">
              {/* <LanguageSwitch /> */}
              {/* <ThemeSwitch /> */}
              {isAuthenticated ? (
                <>
                  <Button
                    color="primary"
                    onPress={() => navigate("/dashboard")}
                  >
                    {t("nav.dashboard")}
                  </Button>
                  {!isLocalMode && (
                    <Button variant="light" onPress={handleLogout}>
                      {t("nav.logout")}
                    </Button>
                  )}
                </>
              ) : !isLocalMode ? (
                <>
                  <Button variant="light" onPress={() => navigate("/login")}>
                    {t("home.loginButton")}
                  </Button>
                  <Button color="primary" onPress={() => navigate("/register")}>
                    {t("home.registerButton")}
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="grow flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6 bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t("home.title")}
            </h1>
            <p className="text-xl text-default-500 mb-8 max-w-2xl mx-auto">
              {t("home.subtitle")}
            </p>
            <div className="flex gap-4 justify-center">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  color="primary"
                  onPress={() => navigate("/dashboard")}
                >
                  {t("home.dashboardButton")}
                </Button>
              ) : !isLocalMode ? (
                <>
                  <Button
                    size="lg"
                    color="primary"
                    onPress={() => navigate("/register")}
                  >
                    {t("home.registerButton")}
                  </Button>
                  <Button
                    size="lg"
                    variant="bordered"
                    onPress={() => navigate("/login")}
                  >
                    {t("home.loginButton")}
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  color="primary"
                  onPress={() => navigate("/dashboard")}
                >
                  Перейти к проектам
                </Button>
              )}
            </div>
          </div>

          {/* Features */}
          {/* <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardBody className="text-center p-8">
                <div className="text-4xl mb-4">🔐</div>
                <h3 className="text-xl font-semibold mb-2">Authentication</h3>
                <p className="text-default-500">
                  Secure user authentication with JWT tokens
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center p-8">
                <div className="text-4xl mb-4">🔔</div>
                <h3 className="text-xl font-semibold mb-2">Notifications</h3>
                <p className="text-default-500">
                  Real-time email notifications via RabbitMQ
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center p-8">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-2">WebSocket Chat</h3>
                <p className="text-default-500">
                  Live chat with WebSocket connections
                </p>
              </CardBody>
            </Card>
          </div> */}
        </div>
      </main>
    </div>
  );
}
