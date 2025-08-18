const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getTheme: () => ipcRenderer.invoke('get-theme')
});
