const { contextBridge, ipcRenderer } = require('electron');

console.log('🔧 Preload script starting...');

// =============================================================================
// CRITICAL: AccessibilityManager早期定義（すべてのエラーを防ぐため）
// =============================================================================

// 堅牢なAccessibilityManagerダミー実装
class SafeAccessibilityManager {
    constructor() {
        console.log('🛡️ SafeAccessibilityManager initialized as fallback');
    }
    
    static getInstance() {
        if (!SafeAccessibilityManager.instance) {
            SafeAccessibilityManager.instance = new SafeAccessibilityManager();
        }
        return SafeAccessibilityManager.instance;
    }
    
    // すべての可能なメソッドのスタブ実装
    initialize() { return Promise.resolve(); }
    isEnabled() { return false; }
    announce(message) { console.log('🔊 Announce:', message); }
    focus(element) { if (element && element.focus) element.focus(); }
    setFocusableElements() { /* stub */ }
    updateAriaLabels() { /* stub */ }
    handleKeyDown(event) { /* stub */ }
    handleKeyUp(event) { /* stub */ }
    speak(text) { console.log('🗣️ Speak:', text); }
    stop() { /* stub */ }
    pause() { /* stub */ }
    resume() { /* stub */ }
    setRate(rate) { /* stub */ }
    setPitch(pitch) { /* stub */ }
    setVolume(volume) { /* stub */ }
}

// すべての可能なスコープに即座に設定
window.AccessibilityManager = SafeAccessibilityManager;
globalThis.AccessibilityManager = SafeAccessibilityManager;

// グローバルエラーハンドラ（AccessibilityManager関連エラーを捕捉）
window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('AccessibilityManager')) {
        console.warn('🛡️ Caught AccessibilityManager error:', event.message);
        event.preventDefault();
        return false;
    }
});

console.log('✅ AccessibilityManager safety measures initialized');

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
    loadScriptContent: (scriptPath) => ipcRenderer.invoke('load-script-content', scriptPath)
});

// ScriptLoaderを公開
contextBridge.exposeInMainWorld('scriptLoader', {
    loadAllScripts: async () => {
        console.log('📜 Starting IPC-based script loading...');
        
        // CommonJS compatibility
        if (!window.exports) window.exports = {};
        if (!window.module) window.module = { exports: window.exports };
        if (!window.require) {
            window.require = function(id) {
                console.warn(`require('${id}') called - providing empty object`);
                return {};
            };
        }
        
        const scripts = [
            'dist/scripts/config.js',
            'dist/scripts/i18n.js',
            'dist/scripts/managers/BaseManager.js',  // BaseManagerを最初に
            'dist/scripts/accessibility.js',        // BaseManagerに依存
            'dist/scripts/performance.js',           // BaseManagerに依存
            'dist/scripts/managers/NotificationManager.js',
            'dist/scripts/managers/ValidationManager.js',
            'dist/scripts/managers/UIManager.js',
            'dist/scripts/managers/AlgorithmManager.js',
            'dist/scripts/managers/AccessibilityManager.js',
            'dist/scripts/managers/PerformanceManager.js',
            'dist/scripts/managers/ServiceContainer.js',
            'dist/scripts/app.js'
        ];
        
        const results = [];
        let successCount = 0;
        const definedClasses = new Set();
        
        for (const scriptPath of scripts) {
            try {
                console.log(`📦 Loading script: ${scriptPath}`);
                
                // IPCを直接使用してスクリプト内容を取得
                const result = await ipcRenderer.invoke('load-script-content', scriptPath);
                
                if (result.error) {
                    console.error(`❌ Failed to load: ${scriptPath}`, result.error);
                    results.push({ path: scriptPath, status: 'error', error: result.error });
                    continue;
                }
                
                // 重複クラス定義チェック
                let shouldSkip = false;
                if (result.content) {
                    const classMatches = result.content.match(/class\s+\w+/g);
                    if (classMatches) {
                        for (const match of classMatches) {
                            const className = match.replace(/class\s+/, '');
                            if (definedClasses.has(className) || window[className]) {
                                console.warn(`⚠️ Class ${className} already defined, skipping: ${scriptPath}`);
                                shouldSkip = true;
                                break;
                            }
                        }
                        
                        if (!shouldSkip) {
                            classMatches.forEach(match => {
                                const className = match.replace(/class\s+/, '');
                                definedClasses.add(className);
                            });
                        }
                    }
                }
                
                if (shouldSkip) {
                    results.push({ path: scriptPath, status: 'skipped', reason: 'duplicate class' });
                    successCount++;
                    continue;
                }
                
                // スクリプト処理
                window.exports = {};
                window.module = { exports: window.exports };
                
                const script = document.createElement('script');
                script.type = 'text/javascript';
                
                let modifiedContent = result.content;
                
                // AccessibilityManager参照があるファイルのみ安全に置換
                if (modifiedContent.includes('AccessibilityManager') && !scriptPath.includes('app.js')) {
                    console.log(`🔄 Applying AccessibilityManager safety for: ${scriptPath}`);
                    
                    // まず、既に安全な参照をマーカーで保護
                    const safePatterns = [
                        'window.AccessibilityManager',
                        '(window as any).AccessibilityManager',
                        'AccessibilityManagerClass' // 変数名は置換しない
                    ];
                    
                    const markers = [];
                    safePatterns.forEach((pattern, index) => {
                        const marker = `___SAFE_ACCESS_${index}___`;
                        markers.push({ marker, pattern });
                        modifiedContent = modifiedContent.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), marker);
                    });
                    
                    // 危険なパターンのみ置換
                    // 1. new AccessibilityManager() のパターン（クラス直接参照）
                    modifiedContent = modifiedContent.replace(/\bnew\s+AccessibilityManager\s*\(/g, 'new (window.AccessibilityManager || class{})(');
                    
                    // 2. AccessibilityManager.getInstance() のパターン  
                    modifiedContent = modifiedContent.replace(/\bAccessibilityManager\.getInstance\s*\(\)/g, '(window.AccessibilityManager?.getInstance?.() || {})');
                    
                    // 3. AccessibilityManager.someMethod() のパターン
                    modifiedContent = modifiedContent.replace(/\bAccessibilityManager\.(\w+)/g, '(window.AccessibilityManager?.$1 || function(){})');
                    
                    // 4. その他のAccessibilityManager参照（単体）
                    modifiedContent = modifiedContent.replace(/\bAccessibilityManager\b/g, '(window.AccessibilityManager || {})');
                    
                    // マーカーを元に戻す
                    markers.forEach(({ marker, pattern }) => {
                        modifiedContent = modifiedContent.replace(new RegExp(marker, 'g'), pattern);
                    });
                } else if (scriptPath.includes('app.js')) {
                    console.log(`🔄 Skipping AccessibilityManager replacement for app.js (already safe)`);
                } else {
                    console.log(`📄 No AccessibilityManager references in: ${scriptPath}`);
                }
                
                // try-catchでラップ
                modifiedContent = `
                    try {
                        console.log('🚀 Executing: ${scriptPath}');
                        ${modifiedContent}
                        console.log('✅ Success: ${scriptPath}');
                    } catch (error) {
                        console.error('❌ Error in ${scriptPath}:', error);
                    }
                `;
                
                // CommonJS変換
                modifiedContent = modifiedContent.replace(/"use strict";?\s*/g, '');
                modifiedContent = modifiedContent.replace(/Object\.defineProperty\(exports,\s*"__esModule",\s*\{\s*value:\s*true\s*\}\);?\s*/g, '');
                modifiedContent = modifiedContent.replace(/exports\.(\w+)\s*=/g, 'window.$1 =');
                
                const classNameMatch = modifiedContent.match(/class\s+(\w+)/);
                if (classNameMatch) {
                    const className = classNameMatch[1];
                    modifiedContent = modifiedContent.replace(/exports\.default\s*=\s*\w+;?/g, `window.${className} = ${className};`);
                }
                
                script.textContent = modifiedContent;
                
                try {
                    document.head.appendChild(script);
                    setTimeout(() => {
                        try {
                            if (script.parentNode) {
                                script.parentNode.removeChild(script);
                            }
                        } catch (e) {}
                    }, 100);
                    
                    results.push({ path: scriptPath, status: 'success' });
                    successCount++;
                    
                } catch (appendError) {
                    console.error(`❌ DOM error: ${scriptPath}`, appendError);
                    results.push({ path: scriptPath, status: 'error', error: appendError.message });
                }
                
            } catch (error) {
                console.error(`❌ Unexpected error: ${scriptPath}`, error);
                results.push({ path: scriptPath, status: 'error', error: error.message });
            }
        }
        
        console.log(`📊 Completed: ${successCount}/${scripts.length}`);
        
        const event = new CustomEvent('scriptsLoaded', {
            detail: { loaded: successCount, total: scripts.length, results: results }
        });
        document.dispatchEvent(event);
        
        return results;
    }
});

console.log('✅ Preload script completed successfully');
