import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]) =>
      ipcRenderer.invoke(channel, ...args),
    on: (channel: string, func: (...args: unknown[]) => void) => {
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    },
    removeListener: (channel: string, func: (...args: unknown[]) => void) => {
      ipcRenderer.removeListener(channel, func);
    },
  },
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
});
