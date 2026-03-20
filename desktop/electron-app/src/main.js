import { app, BrowserWindow, ipcMain, protocol, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHANNELS } from './channels.js';
import { applySecurityPolicy } from './security.js';
import { createUpdateService } from './update.js';
import { getLocalRendererEntry, getPackagedRendererEntry, getRuntimeConfig, normalizeRemoteUrl } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: false
    }
  }
]);

const runtime = getRuntimeConfig();
let mainWindow;
let updateService;
let lifecycleRegistered = false;

function getRendererSource() {
  if (runtime.rendererUrl) {
    return {
      type: 'url',
      value: normalizeRemoteUrl(runtime.rendererUrl, { allowHttpLocalhost: true })
    };
  }

  if (app.isPackaged) {
    return {
      type: 'file',
      value: getPackagedRendererEntry()
    };
  }

  return {
    type: 'file',
    value: getLocalRendererEntry()
  };
}

async function loadRenderer(win) {
  const source = getRendererSource();

  if (source.type === 'url') {
    await win.loadURL(source.value);
    return;
  }

  await win.loadFile(source.value);
}

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1200,
    minHeight: 800,
    title: runtime.appName,
    backgroundColor: '#0b1118',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false
    }
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  window.on('closed', () => {
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  return window;
}

function registerIpcHandlers(win) {
  const updateEnabled = Boolean(runtime.updateUrl);
  updateService = createUpdateService(win, {
    enabled: updateEnabled,
    isDev: !app.isPackaged,
    logLevel: runtime.logLevel
  });

  for (const channel of [CHANNELS.APP_INFO, CHANNELS.OPEN_EXTERNAL, CHANNELS.CHECK_FOR_UPDATES, CHANNELS.INSTALL_UPDATE]) {
    ipcMain.removeHandler(channel);
  }

  ipcMain.handle(CHANNELS.APP_INFO, () => ({
    name: app.getName(),
    version: app.getVersion(),
    appName: runtime.appName,
    appId: runtime.appId,
    platform: process.platform,
    arch: process.arch,
    isPackaged: app.isPackaged,
    updateEnabled
  }));

  ipcMain.handle(CHANNELS.OPEN_EXTERNAL, async (_event, value) => {
    const url = normalizeRemoteUrl(value, { allowHttpLocalhost: false });
    await shell.openExternal(url);
    return { ok: true };
  });

  ipcMain.handle(CHANNELS.CHECK_FOR_UPDATES, async () => updateService.checkForUpdates());
  ipcMain.handle(CHANNELS.INSTALL_UPDATE, async () => updateService.installUpdate());
}

function registerAppLifecycle() {
  if (lifecycleRegistered) {
    return;
  }

  lifecycleRegistered = true;

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }

      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void startApp();
    }
  });
}

async function bootstrap() {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }

  app.setAppUserModelId(runtime.appId);
  app.setName(runtime.appName);

  const updateUrl = runtime.updateUrl ? normalizeRemoteUrl(runtime.updateUrl, { allowHttpLocalhost: !app.isPackaged }) : '';
  mainWindow = createMainWindow();
  applySecurityPolicy(mainWindow, {
    rendererUrl: runtime.rendererUrl,
    updateUrl,
    isDev: !app.isPackaged
  });
  registerIpcHandlers(mainWindow);

  await loadRenderer(mainWindow);

  if (runtime.updateUrl) {
    void updateService.checkForUpdates();
  }
}

async function startApp() {
  try {
    registerAppLifecycle();
    await bootstrap();
  } catch (error) {
    console.error('Failed to boot desktop shell:', error);
    app.quit();
  }
}

app.whenReady().then(() => {
  void startApp();
});
