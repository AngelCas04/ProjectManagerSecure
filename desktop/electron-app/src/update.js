import electronUpdater from 'electron-updater';
import log from 'electron-log/main.js';
import { CHANNELS } from './channels.js';

const { autoUpdater } = electronUpdater;

function emit(window, channel, payload) {
  if (!window || window.isDestroyed()) {
    return;
  }

  window.webContents.send(channel, payload);
}

export function createUpdateService(window, { enabled, isDev, logLevel }) {
  log.transports.file.level = logLevel;
  log.transports.console.level = logLevel;
  autoUpdater.logger = log;
  autoUpdater.removeAllListeners();
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.forceDevUpdateConfig = isDev;

  autoUpdater.on('checking-for-update', () => {
    emit(window, CHANNELS.UPDATE_STATUS, { state: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    emit(window, CHANNELS.UPDATE_STATUS, { state: 'available', version: info.version, releaseName: info.releaseName });
  });

  autoUpdater.on('update-not-available', (info) => {
    emit(window, CHANNELS.UPDATE_STATUS, { state: 'current', version: info.version });
  });

  autoUpdater.on('download-progress', (progress) => {
    emit(window, CHANNELS.UPDATE_PROGRESS, {
      state: 'downloading',
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    emit(window, CHANNELS.UPDATE_STATUS, { state: 'downloaded', version: info.version, releaseName: info.releaseName });
  });

  autoUpdater.on('error', (error) => {
    emit(window, CHANNELS.UPDATE_STATUS, { state: 'error', message: error.message });
  });

  return {
    async checkForUpdates() {
      if (!enabled) {
        return { state: 'disabled' };
      }

      emit(window, CHANNELS.UPDATE_STATUS, { state: 'checking' });
      return autoUpdater.checkForUpdates();
    },
    async installUpdate() {
      if (!enabled) {
        return { state: 'disabled' };
      }

      autoUpdater.quitAndInstall(false, true);
      return { state: 'installing' };
    }
  };
}
