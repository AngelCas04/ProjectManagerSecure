import { contextBridge, ipcRenderer } from 'electron';
import { CHANNELS } from './channels.js';

function on(channel, callback) {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);

  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

contextBridge.exposeInMainWorld('desktopAPI', {
  getAppInfo: () => ipcRenderer.invoke(CHANNELS.APP_INFO),
  openExternal: (url) => ipcRenderer.invoke(CHANNELS.OPEN_EXTERNAL, url),
  checkForUpdates: () => ipcRenderer.invoke(CHANNELS.CHECK_FOR_UPDATES),
  installUpdate: () => ipcRenderer.invoke(CHANNELS.INSTALL_UPDATE),
  onUpdateStatus: (callback) => on(CHANNELS.UPDATE_STATUS, callback),
  onUpdateProgress: (callback) => on(CHANNELS.UPDATE_PROGRESS, callback)
});
