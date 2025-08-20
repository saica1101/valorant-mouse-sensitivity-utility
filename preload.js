const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getVersion: () => ipcRenderer.invoke('get-version'),
    getLanguage: () => ipcRenderer.invoke('get-language'),
    setLanguage: (language) => ipcRenderer.invoke('set-language', language),
    onLanguageChanged: (callback) => ipcRenderer.on('language-changed', callback),
    getAlgorithm: () => ipcRenderer.invoke('get-algorithm'),
    setAlgorithm: (algorithm) => ipcRenderer.invoke('set-algorithm', algorithm),
    onAlgorithmChanged: (callback) => ipcRenderer.on('algorithm-changed', callback),
    lockAlgorithmSelection: () => ipcRenderer.invoke('lock-algorithm-selection'),
    unlockAlgorithmSelection: () => ipcRenderer.invoke('unlock-algorithm-selection')
});
