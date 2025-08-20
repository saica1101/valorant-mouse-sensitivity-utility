const { contextBridge, ipcRenderer } = require('electron');

console.log('🔧 Preload script starting - minimal version...');

// 単純なテスト関数を公開
contextBridge.exposeInMainWorld('testAPI', {
    test: () => {
        console.log('Test API called');
        return 'Test successful';
    }
});

console.log('✅ Minimal preload script loaded successfully');
