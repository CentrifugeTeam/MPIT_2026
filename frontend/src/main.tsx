import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { HeroUIProvider } from "@heroui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./shared/config/queryClient";
import { useThemeStore } from "./store/themeStore";
import { useUserStore } from "./store/userStore";
import { ToastProvider } from "./shared/components/ToastProvider";
import { isLocalMode } from "./shared/config/env";
import "./shared/config/i18n";
import "./css/global.css";
import App from "./App.tsx";

// Initialize theme on app load
const initialTheme = useThemeStore.getState().theme;
document.documentElement.classList.add(
  initialTheme,
  "text-foreground",
  "bg-background"
);

// Initialize local user in local mode
if (isLocalMode) {
  const { initializeLocalUser } = useUserStore.getState();
  initializeLocalUser();
  console.log("🔧 Локальный пользователь инициализирован");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider>
          <ToastProvider />
          <App />
        </HeroUIProvider>
      </QueryClientProvider>
    </HashRouter>
  </StrictMode>
);
