/**
 * Internationalization (i18n) System - Unified Version
 * 統一された多言語対応システム
 */

interface Translation {
    app: {
        title: string;
        fullName: string;
        description: string;
    };
    ui: {
        title: string;
        subtitle: string;
        language: string;
        version: string;
        darkMode: string;
        lightMode: string;
        themeToggle: string;
        backButton: string;
        step1: string;
        dpiLabel: string;
        dpiPlaceholder: string;
        dpiHelp: string;
        dpiPresets: string;
        startButton: string;
        adjustmentTitle: string;
        rangeLabel: string;
        dValueLabel: string;
        comparisonInstructions: string;
        candidatesLabel: string;
        candidateA: string;
        candidateB: string;
        leftOption: string;
        rightOption: string;
        equalOption: string;
        equalOptionNatural: string;
        finishTitle: string;
        finishMessage: string;
        finalSensitivity: string;
        copyButton: string;
        restartButton: string;
        progress: string;
        progressConvergence: string;
        progressCurrentRange: string;
        progressIterations: string;
        algorithm: {
            title: string;
            ternary: string;
            natural: string;
        };
    };
    algorithms: {
        ternary: {
            description: string;
        };
        natural: {
            description: string;
        };
    };
    errors: {
        dpiRange: string;
    };
    notifications: {
        adjustmentStarted: string;
        adjustmentCompleted: string;
        algorithmChanged: string;
        dpiBelowMinimum: string;
        dpiAboveMaximum: string;
        invalidDpiFormat: string;
        settingsSaved: string;
        settingsLoaded: string;
        languageChanged: string;
        copied: string;
    };
}

interface I18NManager {
    currentLanguage: 'ja' | 'en';
    translations: {
        ja: Translation;
        en: Translation;
    };
    t(key: string, defaultValue?: string): string;
    setLanguage(language: 'ja' | 'en'): void;
    getCurrentLanguage(): 'ja' | 'en';
}

const translations = {
    ja: {
        app: {
            title: 'VMSU',
            fullName: 'Valorant Mouse Sensitivity Utility',
            description: '最適なマウス感度を見つけましょう'
        },
        ui: {
            title: 'Valorant Mouse Sensitivity Utility',
            subtitle: '最適なマウス感度を見つけましょう',
            language: '言語',
            version: 'バージョン',
            darkMode: 'ダークモード',
            lightMode: 'ライトモード',
            themeToggle: 'テーマを切り替える',
            backButton: '戻る',
            step1: 'Step 1: マウスDPIを入力または選択',
            dpiLabel: 'DPI値を入力',
            dpiPlaceholder: '例: 800',
            dpiHelp: 'DPI値は400から50000の間で入力してください',
            dpiPresets: 'プリセットDPI値',
            startButton: '感度調整を開始',
            adjustmentTitle: '感度調整',
            rangeLabel: '調整範囲',
            dValueLabel: 'Base',
            comparisonInstructions: '以下の2つの感度を試して、どちらが快適か選んでください',
            candidatesLabel: '感度候補の比較',
            candidateA: '候補A',
            candidateB: '候補B',
            leftOption: 'Aが快適',
            rightOption: 'Bが快適',
            equalOption: 'どちらも同じ',
            equalOptionNatural: '完了',
            finishTitle: '調整完了',
            finishMessage: '最適なマウス感度が見つかりました',
            finalSensitivity: '感度',
            copyButton: '感度をコピー',
            restartButton: '再調整',
            progress: '進行状況',
            progressConvergence: '収束まで',
            progressCurrentRange: '現在の範囲',
            progressIterations: '回',
            algorithm: {
                title: 'アルゴリズム選択',
                ternary: '三分探索PSAメソッド',
                natural: 'ナチュラルPSAメソッド'
            }
        },
        algorithms: {
            ternary: {
                description: '効率的な三分探索アルゴリズムで最適な感度を見つけます'
            },
            natural: {
                description: '自然な感覚でステップバイステップで調整します'
            }
        },
        errors: {
            dpiRange: 'DPI値は400から50000の間で入力してください'
        },
        notifications: {
            adjustmentStarted: '感度調整を開始しました',
            adjustmentCompleted: '感度調整が完了しました',
            algorithmChanged: 'アルゴリズムが変更されました',
            dpiBelowMinimum: 'DPI値が最小値を下回っています',
            dpiAboveMaximum: 'DPI値が最大値を超えています',
            invalidDpiFormat: 'DPI値の形式が正しくありません',
            settingsSaved: '設定が保存されました',
            settingsLoaded: '設定が読み込まれました',
            languageChanged: '言語が変更されました',
            copied: 'クリップボードにコピーしました'
        }
    },
    en: {
        app: {
            title: 'VMSU',
            fullName: 'Valorant Mouse Sensitivity Utility',
            description: 'Find your optimal mouse sensitivity'
        },
        ui: {
            title: 'Valorant Mouse Sensitivity Utility',
            subtitle: 'Find your optimal mouse sensitivity',
            language: 'Language',
            version: 'Version',
            darkMode: 'Dark Mode',
            lightMode: 'Light Mode',
            themeToggle: 'Toggle theme',
            backButton: 'Back',
            step1: 'Step 1: Enter or select your mouse DPI',
            dpiLabel: 'Enter DPI value',
            dpiPlaceholder: 'e.g., 800',
            dpiHelp: 'Please enter a DPI value between 400 and 50,000',
            dpiPresets: 'Preset DPI values',
            startButton: 'Start sensitivity adjustment',
            adjustmentTitle: 'Sensitivity Adjustment',
            rangeLabel: 'Adjustment Range',
            dValueLabel: 'Base',
            comparisonInstructions: 'Try both sensitivities and choose which feels more comfortable',
            candidatesLabel: 'Sensitivity Comparison',
            candidateA: 'Option A',
            candidateB: 'Option B',
            leftOption: 'A feels better',
            rightOption: 'B feels better',
            equalOption: 'Both are equal',
            equalOptionNatural: 'Complete',
            finishTitle: 'Complete',
            finishMessage: 'Optimal sensitivity found',
            finalSensitivity: 'Sensitivity',
            copyButton: 'Copy sensitivity',
            restartButton: 'Adjust again',
            progress: 'Progress',
            progressConvergence: 'Until convergence',
            progressCurrentRange: 'Current range',
            progressIterations: 'times',
            algorithm: {
                title: 'Algorithm Selection',
                ternary: 'Ternary Search PSA Method',
                natural: 'Natural PSA Method'
            }
        },
        algorithms: {
            ternary: {
                description: 'Find optimal sensitivity with efficient ternary search algorithm'
            },
            natural: {
                description: 'Adjust step by step with natural feeling'
            }
        },
        errors: {
            dpiRange: 'Please enter a DPI value between 400 and 50,000'
        },
        notifications: {
            adjustmentStarted: 'Sensitivity adjustment started',
            adjustmentCompleted: 'Sensitivity adjustment completed',
            algorithmChanged: 'Algorithm has been changed',
            dpiBelowMinimum: 'DPI value is below minimum',
            dpiAboveMaximum: 'DPI value exceeds maximum',
            invalidDpiFormat: 'Invalid DPI format',
            settingsSaved: 'Settings saved',
            settingsLoaded: 'Settings loaded',
            languageChanged: 'Language changed',
            copied: 'Copied to clipboard'
        }
    }
};

class I18N implements I18NManager {
    currentLanguage: 'ja' | 'en' = 'ja';
    translations = translations;

    t(key: string, defaultValue?: string): string {
        const keys = key.split('.');
        let value: any = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                console.warn(`Translation key not found: ${key} (current language: ${this.currentLanguage})`);
                return defaultValue || key;
            }
        }
        
        if (typeof value !== 'string') {
            console.warn(`Translation value is not a string: ${key} (current language: ${this.currentLanguage})`);
            return defaultValue || key;
        }
        
        return value;
    }

    setLanguage(language: 'ja' | 'en'): void {
        this.currentLanguage = language;
    }

    getCurrentLanguage(): 'ja' | 'en' {
        return this.currentLanguage;
    }
}

export const i18n = new I18N();
export type { I18NManager, Translation };
