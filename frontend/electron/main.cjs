const { app, BrowserWindow } = require("electron");
const path = require("node:path");

const isDev = !app.isPackaged;

// Определяем режим работы (локальный или облачный)
// По умолчанию облачный режим (безопасно для production)
const isLocalMode = process.env.VITE_BACKEND_LOCAL === "true";

console.log("🚀 Запуск приложения");
console.log("📦 Режим:", isDev ? "Разработка" : "Production");
console.log("🌐 Backend:", isLocalMode ? "Локальный (localhost)" : "Облачный");
console.log("🔧 VITE_BACKEND_LOCAL:", process.env.VITE_BACKEND_LOCAL || "false (не установлена)");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Разрешаем Node.js интеграцию (опционально)
      nodeIntegration: false,
      contextIsolation: true,

      // В локальном режиме полностью отключаем web security для разработки
      webSecurity: isLocalMode ? false : (isDev ? false : true),

      // Разрешаем загрузку внешних ресурсов
      allowRunningInsecureContent: false,

      // preload: path.join(__dirname, 'preload.js')
    },
  });

  const url = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "../dist/index.html")}`;

  win.loadURL(url);

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {

    if (isLocalMode) {
      callback({ responseHeaders: details.responseHeaders });
      return;
    }

    // В облачном режиме применяем CSP
    if (details.url.includes('localhost:5173')) {
      const connectSrc = "'self' https://affectedly-optimistic-turkey.cloudpub.ru wss://affectedly-optimistic-turkey.cloudpub.ru ws://localhost:*";
      const defaultSrc = "'self' https://affectedly-optimistic-turkey.cloudpub.ru";

      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            `default-src ${defaultSrc}; ` +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: https: http:; " +
              `connect-src ${connectSrc}; ` +
              "font-src 'self' data:;",
          ],
        },
      });
    } else {
      callback({ responseHeaders: details.responseHeaders });
    }
  });

  if (isDev && !isLocalMode) {
    win.webContents.openDevTools();
  }

  // Обработчик закрытия окна - завершаем процесс
  win.on('closed', () => {
    console.log("🖥️  Окно закрыто - завершение процесса");
    app.quit();
  });
}

app.whenReady().then(() => {
  console.log("✅ Electron готов - создание окна");
  createWindow();
});

app.on("window-all-closed", () => {
  console.log("🖥️  Все окна закрыты - завершение приложения");
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
