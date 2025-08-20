const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { updateElectronApp, UpdateSourceType } = require('update-electron-app');
const path = require('path');

// 自動アップデート設定
updateElectronApp({
  updateSource: {
    type: UpdateSourceType.ElectronPublicUpdateService,
    repo: 'saica1101/valorant-mouse-sensitivity-utility'
  },
  updateInterval: "1 hour",
  logger: require("electron-log")
});

let mainWindow;
let currentLanguage = 'ja'; // デフォルト言語
let currentAlgorithm = 'ternary'; // デフォルトアルゴリズム
let isAlgorithmLocked = false; // アルゴリズム選択のロック状態

// メニューテンプレートを動的に作成
function createMenuTemplate() {
  const isJapanese = currentLanguage === 'ja';
  
  return [
    {
      label: isJapanese ? 'File' : 'File',
      submenu: [
        {
          label: isJapanese ? 'プログラムを終了する' : 'Exit Program',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: isJapanese ? 'Option' : 'Option',
      submenu: [
        {
          label: isJapanese ? 'Language' : 'Language',
          submenu: [
            {
              label: isJapanese ? 'Japanese' : 'Japanese',
              type: 'radio',
              checked: currentLanguage === 'ja',
              click: () => {
                setLanguage('ja');
              }
            },
            {
              label: isJapanese ? 'English' : 'English',
              type: 'radio',
              checked: currentLanguage === 'en',
              click: () => {
                setLanguage('en');
              }
            }
          ]
        },
        { type: 'separator' },
        {
          label: isJapanese ? 'アルゴリズム' : 'Algorithm',
          submenu: [
            {
              label: isJapanese ? '三分探索PSAメソッド' : 'Ternary search PSA method',
              type: 'radio',
              checked: currentAlgorithm === 'ternary',
              enabled: !isAlgorithmLocked,
              click: () => {
                if (!isAlgorithmLocked) {
                  setAlgorithm('ternary');
                }
              }
            },
            {
              label: isJapanese ? 'ナチュラルPSAメソッド' : 'Natural PSA method',
              type: 'radio',
              checked: currentAlgorithm === 'natural',
              enabled: !isAlgorithmLocked,
              click: () => {
                if (!isAlgorithmLocked) {
                  setAlgorithm('natural');
                }
              }
            }
          ]
        }
      ]
    }
  ];
}

// 言語設定変更
function setLanguage(language) {
  currentLanguage = language;
  updateMenu();
  
  // レンダラープロセスに言語変更を通知
  if (mainWindow) {
    mainWindow.webContents.send('language-changed', language);
  }
}

// アルゴリズム設定変更
function setAlgorithm(algorithm) {
  if (isAlgorithmLocked) {
    return;
  }
  
  currentAlgorithm = algorithm;
  updateMenu();
  
  // レンダラープロセスにアルゴリズム変更を通知
  if (mainWindow) {
    mainWindow.webContents.send('algorithm-changed', algorithm);
  }
}

// アルゴリズム選択をロック
function lockAlgorithmSelection() {
  isAlgorithmLocked = true;
  updateMenu();
}

// アルゴリズム選択のロックを解除
function unlockAlgorithmSelection() {
  isAlgorithmLocked = false;
  updateMenu();
}

// メニューを更新
function updateMenu() {
  const menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 640,
    height: 770,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: null, // アイコンファイルがある場合は設定
    show: false,
    autoHideMenuBar: false,
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // メニューを設定
    updateMenu();
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

// バージョン情報取得のIPC通信
ipcMain.handle('get-version', () => {
  return app.getVersion();
});

// 言語設定取得のIPC通信
ipcMain.handle('get-language', () => {
  return currentLanguage;
});

// 言語設定変更のIPC通信
ipcMain.handle('set-language', (event, language) => {
  setLanguage(language);
  return currentLanguage;
});

// アルゴリズム設定取得のIPC通信
ipcMain.handle('get-algorithm', () => {
  return currentAlgorithm;
});

// アルゴリズム設定変更のIPC通信
ipcMain.handle('set-algorithm', (event, algorithm) => {
  setAlgorithm(algorithm);
  return currentAlgorithm;
});

// アルゴリズム選択ロックのIPC通信
ipcMain.handle('lock-algorithm-selection', () => {
  lockAlgorithmSelection();
  return isAlgorithmLocked;
});

// アルゴリズム選択ロック解除のIPC通信
ipcMain.handle('unlock-algorithm-selection', () => {
  unlockAlgorithmSelection();
  return isAlgorithmLocked;
});