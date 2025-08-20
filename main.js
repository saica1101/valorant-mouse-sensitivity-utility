const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { updateElectronApp, UpdateSourceType } = require('update-electron-app');
const path = require('path');
const fs = require('fs');

console.log('🚀 Main process starting...');
console.log(`📁 App path: ${app.getAppPath()}`);
console.log(`📂 Current working directory: ${process.cwd()}`);

let mainWindow = null;

// 自動アップデート設定
updateElectronApp({
  updateSource: {
    type: UpdateSourceType.ElectronPublicUpdateService,
    repo: 'saica1101/valorant-mouse-sensitivity-utility'
  },
  updateInterval: "1 hour",
  logger: require("electron-log")
});

// 設定ファイルのパス
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

// システム言語を取得してデフォルト言語を決定
function getDefaultLanguage() {
  const systemLocale = app.getLocale();
  const envLang = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || process.env.LC_MESSAGES || '';
  const userLocale = Intl.DateTimeFormat().resolvedOptions().locale || '';
  
  // 複数のソースから言語を判定
  let detectedLocale = systemLocale;
  if (!detectedLocale || detectedLocale.length === 0) {
    detectedLocale = userLocale;
  }
  if (!detectedLocale || detectedLocale.length === 0) {
    detectedLocale = envLang;
  }
  
  // 日本語の場合は 'ja'、それ以外は 'en' を返す
  const isJapanese = detectedLocale && (detectedLocale.startsWith('ja') || detectedLocale.includes('JP'));
  const defaultLang = isJapanese ? 'ja' : 'en';
  
  return defaultLang;
}

// デフォルト設定
const defaultSettings = {
  language: getDefaultLanguage(),
  algorithm: 'ternary'
};

// 設定を読み込み
function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      const parsed = JSON.parse(data);
      const result = { ...defaultSettings, ...parsed };
      return result;
    } else {
      // 初回起動時はシステム言語に基づくデフォルト設定を保存
      saveSettings(defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.warn('設定ファイルの読み込みに失敗しました:', error);
  }
  return defaultSettings;
}

// 設定を保存
function saveSettings(settings) {
  try {
    const userDataPath = path.dirname(settingsPath);
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('設定ファイルの保存に失敗しました:', error);
  }
}

// 設定を読み込んで変数に設定
const settings = loadSettings();
let currentLanguage = settings.language;
let currentAlgorithm = settings.algorithm;
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
  // 同じ言語の場合はスキップ
  if (currentLanguage === language) {
    return;
  }
  
  currentLanguage = language;
  
  // 設定を保存
  saveSettings({
    language: currentLanguage,
    algorithm: currentAlgorithm
  });
  
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
  
  // 設定を保存
  saveSettings({
    language: currentLanguage,
    algorithm: currentAlgorithm
  });
  
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
  console.log('🖼️ Creating main window...');
  console.log(`📄 Preload path: ${path.join(__dirname, 'preload.js')}`);
  console.log(`🏠 Index.html path: ${path.join(__dirname, 'index.html')}`);
  
  mainWindow = new BrowserWindow({
    width: 640,
    height: 770,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: true
    },
    icon: null, // アイコンファイルがある場合は設定
    show: false,
    autoHideMenuBar: false
  });

  console.log('⚡ Loading index.html...');
  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    console.log('✅ Window ready to show');
    
    // レンダラープロセスのコンソールメッセージをキャプチャ
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      const prefix = level === 1 ? '🔍' : level === 2 ? '⚠️' : level === 3 ? '❌' : 'ℹ️';
      console.log(`${prefix} [Renderer] ${message}`);
    });
    
    mainWindow.show();
    // 管理者ツールを表示する
    // mainWindow.openDevTools();
    // メニューを設定
    updateMenu();
  });

  mainWindow.on('closed', () => {
    console.log('🔒 Window closed');
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // アプリ準備完了後にシステム言語を再確認
  const systemLocaleAfterReady = app.getLocale();
  
  createWindow();
});

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

// システム言語取得のIPC通信
ipcMain.handle('get-system-locale', () => {
  return app.getLocale();
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

// 環境情報取得のIPC通信
ipcMain.handle('get-environment-info', () => {
  return {
    isDevelopment: process.env.NODE_ENV === 'development' || !app.isPackaged,
    platform: process.platform,
    version: app.getVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node
  };
});

// スクリプト読み込み支援のためのIPCハンドラーを追加
ipcMain.handle('load-script-content', async (event, scriptPath) => {
  try {
    console.log(`📜 Loading script content for: ${scriptPath}`);
    
    // パッケージ化されているかどうかを判定
    const isPackaged = app.isPackaged;
    let fullPath;
    
    if (isPackaged) {
      // パッケージ化されている場合、複数のパスを試行
      const possiblePaths = [
        // extraResourceとして配置されるdistフォルダ
        path.join(process.resourcesPath, 'dist', scriptPath.replace('dist/', '')),
        path.join(process.resourcesPath, scriptPath),
        // ASARアーカイブ内のパス  
        path.join(__dirname, scriptPath),
        path.join(app.getAppPath(), scriptPath),
        // 旧パス（互換性のため）
        path.join(process.resourcesPath, 'app', scriptPath),
        path.join(process.resourcesPath, 'app.asar', scriptPath)
      ];
      
      console.log(`📦 Is packaged: ${isPackaged}`);
      console.log(`� Trying paths:`);
      
      for (const testPath of possiblePaths) {
        console.log(`  - ${testPath}`);
        if (fs.existsSync(testPath)) {
          fullPath = testPath;
          console.log(`✅ Found at: ${fullPath}`);
          break;
        }
      }
      
      if (!fullPath) {
        console.log(`❌ File not found in any location for: ${scriptPath}`);
        // ASARファイル内のリソースを試行
        try {
          const asarPath = path.join(__dirname, scriptPath);
          const content = fs.readFileSync(asarPath, 'utf8');
          console.log(`✅ Successfully loaded from ASAR: ${scriptPath} (${content.length} chars)`);
          return { success: true, content: content, path: asarPath };
        } catch (asarError) {
          console.log(`❌ ASAR fallback failed:`, asarError.message);
          return { success: false, error: `File not found: ${scriptPath}. Tried multiple locations.` };
        }
      }
    } else {
      // 開発環境
      fullPath = path.join(app.getAppPath(), scriptPath);
    }
    
    console.log(`📂 Full path: ${fullPath}`);
    
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      console.log(`✅ Successfully loaded: ${scriptPath} (${content.length} chars)`);
      return { success: true, content: content, path: fullPath };
    } else {
      console.log(`❌ File not found: ${fullPath}`);
      return { success: false, error: `File not found: ${fullPath}` };
    }
  } catch (error) {
    console.error(`❌ Error loading script ${scriptPath}:`, error);
    return { success: false, error: error.message };
  }
});