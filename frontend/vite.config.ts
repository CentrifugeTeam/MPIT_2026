import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  console.log('🔧 Vite Config - VITE_BACKEND_LOCAL:', process.env.VITE_BACKEND_LOCAL);
  console.log('🔧 Vite Config - mode:', mode);

  return {
    base: "./",
    plugins: [react(), tailwindcss(), svgr()],
    define: {
      'import.meta.env.VITE_BACKEND_LOCAL': JSON.stringify(process.env.VITE_BACKEND_LOCAL || 'false'),
    },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: [".cloudpub.ru"],
    hmr: {
      // Используйте clientPort: 80 только когда frontend работает через nginx
      // Для локальной разработки закомментируйте эту строку
      // clientPort: 80,
    },
    watch: {
      usePolling: true,
    },
    headers: {
      // В локальном режиме отключаем CSP полностью
      ...(process.env.VITE_BACKEND_LOCAL === "true" && {
        "Content-Security-Policy": "",
      }),
    },
  }
  };
});
