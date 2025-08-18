const { app, BrowserWindow, ipcMain } = require('electron');
const { updateElectronApp } = require('update-electron-app');
const path = require('path');

// 自動アップデート設定
updateElectronApp();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 540,
    height: 650,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: null, // アイコンファイルがある場合は設定
    show: false,
    autoHideMenuBar: true
  });

  mainWindow.loadFile('index.html');

  // 開発環境でDevToolsを開く場合はコメントアウト
  // mainWindow.webContents.openDevTools();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// テーマ切り替えのIPC通信
ipcMain.handle('get-theme', () => {
  return 'light'; // デフォルトはライトテーマ
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});