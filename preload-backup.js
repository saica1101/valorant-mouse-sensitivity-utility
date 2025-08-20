const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

console.log('🔧 Preload script starting...');
console.log(`📂 Current working directory from preload: ${process.cwd()}`);
console.log(`📁 __dirname from preload: ${__dirname}`);

contextBridge.exposeInMainWorld('electronAPI', {
    getVersion: () => ipcRenderer.invoke('get-version'),
    getSystemLocale: () => ipcRenderer.invoke('get-system-locale'),
    getLanguage: () => ipcRenderer.invoke('get-language'),
    setLanguage: (language) => ipcRenderer.invoke('set-language', language),
    onLanguageChanged: (callback) => ipcRenderer.on('language-changed', callback),
    getAlgorithm: () => ipcRenderer.invoke('get-algorithm'),
    setAlgorithm: (algorithm) => ipcRenderer.invoke('set-algorithm', algorithm),
    onAlgorithmChanged: (callback) => ipcRenderer.on('algorithm-changed', callback),
    lockAlgorithmSelection: () => ipcRenderer.invoke('lock-algorithm-selection'),
    unlockAlgorithmSelection: () => ipcRenderer.invoke('unlock-algorithm-selection'),
    getEnvironmentInfo: () => ipcRenderer.invoke('get-environment-info'),
    loadScriptContent: (scriptPath) => ipcRenderer.invoke('load-script-content', scriptPath),
    
    // パス解決のヘルパー関数を提供
    getAppPath: () => __dirname,
    isPackaged: process.env.NODE_ENV !== 'development'
});

// スクリプトを動的に読み込む関数
const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(src);
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
};

// スクリプト読み込み機能をコンテキストブリッジで公開
contextBridge.exposeInMainWorld('scriptLoader', {
    // 必要なスクリプトを順番に読み込む
    loadAllScripts: async () => {
        console.log('📜 Starting IPC-based script loading...');
        
        const scripts = [
            'dist/scripts/managers/ServiceContainer.js',
            'dist/scripts/managers/BaseManager.js',
            'dist/scripts/managers/NotificationManager.js',
            'dist/scripts/managers/ValidationManager.js',
            'dist/scripts/managers/UIManager.js',
            'dist/scripts/managers/AlgorithmManager.js',
            'dist/scripts/managers/AccessibilityManager.js',
            'dist/scripts/app.js'
        ];

        const results = [];
        let successCount = 0;
        
        for (const scriptPath of scripts) {
            try {
                console.log(`🔍 Attempting to load via IPC: ${scriptPath}`);
                
                // メインプロセス経由でスクリプトを読み込み
                const result = await ipcRenderer.invoke('load-script-content', scriptPath);
                
                if (result.success) {
                    console.log(`✅ IPC loaded: ${scriptPath} (${result.content.length} chars)`);
                    
                    // スクリプトを実行
                    const script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.textContent = result.content;
                    document.head.appendChild(script);
                    
                    results.push({ path: scriptPath, status: 'loaded' });
                    successCount++;
                    console.log(`✅ Successfully executed: ${scriptPath}`);
                } else {
                    console.error(`❌ IPC load failed: ${scriptPath}`, result.error);
                    results.push({ path: scriptPath, status: 'error', error: result.error });
                }
                
            } catch (error) {
                console.error(`❌ Failed to load: ${scriptPath}`, error);
                results.push({ path: scriptPath, status: 'error', error: error.message });
            }
        }
        
        console.log(`📊 Script loading completed. Loaded: ${successCount}/${scripts.length}`);
        
        // スクリプト読み込み完了イベントを発火
        const event = new CustomEvent('scriptsLoaded', {
            detail: {
                loaded: successCount,
                total: scripts.length,
                results: results
            }
        });
        document.dispatchEvent(event);
        
        return results;
    }
});

console.log('✅ Preload script loaded successfully - IPC-based script loading enabled');
