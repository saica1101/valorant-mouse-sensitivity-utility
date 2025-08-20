/**
 * Valorant Mouse Sensitivity Utility - Configuration
 * アプリケーション設定ファイル
 */

const CONFIG = {
    // 感度計算の基準値
    BASE_SENSI: 80,
    
    // アルゴリズム設定
    ALGORITHM: {
        MIN_SENSI: 0.1,
        MAX_SENSI: 5.0,
        RANGE_MULTIPLIER: 8,
        CONVERGENCE_THRESHOLD: 0.001
    },
    
    // DPIプリセット値
    DPI_PRESETS: [400, 800, 1600, 3200],
    
    // 入力検証設定
    VALIDATION: {
        MIN_DPI: 100,
        MAX_DPI: 50000,
        MIN_SENSI: 0.1,
        MAX_SENSI: 10.0
    },
    
    // UI設定
    UI: {
        ERROR_DISPLAY_DURATION: 3000, // エラー表示時間（ミリ秒）
        SUCCESS_DISPLAY_DURATION: 2000, // 成功表示時間（ミリ秒）
        ANIMATION_DURATION: 300, // アニメーション時間（ミリ秒）
        DECIMAL_PLACES: 3 // 表示精度
    },
    
    // テーマ設定
    THEME: {
        DEFAULT: 'light',
        STORAGE_KEY: 'theme'
    },
    
    // アプリケーション情報
    APP: {
        NAME: 'VMSU',
        FULL_NAME: 'Valorant Mouse Sensitivity Utility',
        DESCRIPTION: '最適なマウス感度を見つけましょう',
        FALLBACK_VERSION: 'v1.3.4'
    }
};

// ES6モジュールとしてもCommonJSとしても使用可能
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
