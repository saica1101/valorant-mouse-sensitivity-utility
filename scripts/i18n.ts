/**
 * Internationalization (i18n) System (TypeScript版)
 * 多言語対応システム
 */

// 翻訳データの型定義
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
        step1: string;
        dpiLabel: string;
        dpiPlaceholder: string;
        dpiHelp: string;
        dpiPresets: string;
        startButton: string;
        algorithm: {
            title: string;
            ternary: string;
            natural: string;
            disabled: string;
        };
        adjustmentTitle: string;
        adjustmentTitleNatural: string;
        rangeLabel: string;
        dValueLabel: string;
        comparisonInstructions: string;
        comparisonInstructionsNatural: string;
        candidatesLabel: string;
        candidateA: string;
        candidateB: string;
        leftOption: string;
        rightOption: string;
        equalOption: string;
        equalOptionNatural: string;
        backButton: string;
        resetButton: string;
        finishTitle: string;
        finishMessage: string;
        completeTitle: string;
        finalSensitivity: string;
        copyButton: string;
        copySuccess: string;
        copyError: string;
        restartButton: string;
        settings: {
            title: string;
            targetSize: string;
            distance: string;
            theme: string;
            save: string;
            reset: string;
        };
    };
    notifications: {
        welcome: string;
        dpiSelected: string;
        adjustmentStarted: string;
        adjustmentStartedWithDpi: string;
        adjustmentCompleted: string;
        adjustmentCompletedWithValue: string;
        settingsSaved: string;
        themeChanged: string;
        algorithmLocked: string;
        algorithmUnlocked: string;
        copy: {
            success: string;
            error: string;
            noValue: string;
            clickToCopy: string;
        };
        errors: {
            adjustmentStart: string;
            invalidDpi: string;
            dpiOutOfRange: string;
        };
    };
    phases: {
        setup: string;
        adjustment: string;
        complete: string;
    };
    errors: {
        dpiRequired: string;
        dpiInvalid: string;
        dpiRange: string;
        systemError: string;
        loadError: string;
        saveError: string;
        validationError: string;
        networkError: string;
        algorithmError: string;
        calculationError: string;
        initializationError: string;
        configurationError: string;
        permissionError: string;
        notSupportedError: string;
        timeoutError: string;
        unknownError: string;
    };
    accessibility: {
        skipToContent: string;
        mainContent: string;
        navigation: string;
        openLanguageMenu: string;
        closeLanguageMenu: string;
        selectLanguage: string;
        screenReaderOnly: string;
        loading: string;
        required: string;
        invalid: string;
        valid: string;
        instructions: string;
        announcement: string;
        progress: string;
        step: string;
        of: string;
        complete: string;
        error: string;
        warning: string;
        info: string;
        success: string;
    };
    algorithms: {
        ternary: {
            name: string;
            description: string;
            instruction: string;
            features: string[];
        };
        natural: {
            name: string;
            description: string;
            instruction: string;
            features: string[];
        };
    };
    tooltips: {
        dpiInfo: string;
        algorithmTernary: string;
        algorithmNatural: string;
        sensitivityRange: string;
        copyResult: string;
        resetApp: string;
        languageSelect: string;
        themeToggle: string;
        backStep: string;
    };
}

interface Translations {
    ja: Translation;
    en: Translation;
}

interface LocalI18NManager {
    currentLanguage: 'ja' | 'en';
    translations: Translations;
    isReady: boolean;
    
    t(key: string, params?: Record<string, string | number>): string;
    setLanguage(language: 'ja' | 'en'): void;
    getCurrentLanguage(): 'ja' | 'en';
    getSupportedLanguages(): string[];
    loadSavedLanguage(): void;
    saveLanguage(): void;
    updatePageContent(): void;
    init(): Promise<void>;
}

const I18N: LocalI18NManager = {
    currentLanguage: 'ja',
    isReady: false,
    
    translations: {
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
                
                step1: 'Step 1: マウスDPIを入力または選択',
                dpiLabel: 'DPI値を入力:',
                dpiPlaceholder: '例: 800',
                dpiHelp: 'DPI値は400から50,000の間で入力してください',
                dpiPresets: 'プリセットDPI値:',
                startButton: '感度調整を開始',
                
                algorithm: {
                    title: 'アルゴリズム選択',
                    ternary: '三分探索PSAメソッド',
                    natural: 'ナチュラルPSAメソッド',
                    disabled: 'DPI選択後は変更できません'
                },
                
                adjustmentTitle: '感度調整',
                adjustmentTitleNatural: '感度調整',
                rangeLabel: '調整範囲',
                dValueLabel: 'ベース',
                comparisonInstructions: '以下の2つの感度を試して、どちらが快適か選んでください：',
                comparisonInstructionsNatural: '以下の2つの感度を試して、より快適な方を選んでください：',
                candidatesLabel: '感度候補の比較',
                candidateA: '候補A',
                candidateB: '候補B',
                leftOption: '👈 Aが快適',
                rightOption: '👉 Bが快適',
                equalOption: '🟰 どちらも同じ',
                equalOptionNatural: '✅ 完了',
                
                backButton: '🔙 戻る',
                resetButton: '🔄 Reset',
                
                finishTitle: '🎉 完了！',
                finishMessage: '最適な感度が見つかりました！',
                completeTitle: '🎯 最適な感度が見つかりました！',
                finalSensitivity: '最終感度',
                copyButton: 'クリップボードにコピー',
                copySuccess: '感度値がクリップボードにコピーされました！',
                copyError: 'コピーに失敗しました',
                restartButton: 'もう一度調整する',
                
                settings: {
                    title: '設定',
                    targetSize: 'ターゲットサイズ (cm)',
                    distance: '距離 (cm)',
                    theme: 'テーマ',
                    save: '保存',
                    reset: 'リセット'
                }
            },
            
            // 通知
            notifications: {
                welcome: 'Valorant Mouse Sensitivity Utilityへようこそ！',
                dpiSelected: 'DPI値が設定されました',
                adjustmentStarted: '感度調整を開始しました',
                adjustmentStartedWithDpi: '感度調整を開始します。DPI: {{dpi}}',
                adjustmentCompleted: '感度調整が完了しました',
                adjustmentCompletedWithValue: '最適な感度が見つかりました: {{value}}',
                settingsSaved: '設定が保存されました',
                themeChanged: 'テーマが変更されました',
                algorithmLocked: 'アルゴリズム選択がロックされました',
                algorithmUnlocked: 'アルゴリズム選択のロックが解除されました',
                copy: {
                    success: 'クリップボードにコピーしました',
                    error: 'コピーに失敗しました',
                    noValue: 'コピーする値がありません',
                    clickToCopy: 'クリックでコピー'
                },
                errors: {
                    adjustmentStart: '調整開始中にエラーが発生しました: {{error}}',
                    invalidDpi: '正しいDPI値を入力してください（1以上50,000未満）',
                    dpiOutOfRange: 'DPIは{{min}}から{{max}}の間で入力してください'
                }
            },
            
            phases: {
                setup: 'セットアップ',
                adjustment: '調整',
                complete: '完了'
            },
            
            errors: {
                dpiRequired: 'DPI値を入力してください',
                dpiInvalid: '有効なDPI値を入力してください',
                dpiRange: 'DPI値は400から50,000の間で入力してください',
                systemError: 'システムエラーが発生しました',
                loadError: 'データの読み込みに失敗しました',
                saveError: 'データの保存に失敗しました',
                validationError: '入力値が無効です',
                networkError: 'ネットワークエラーが発生しました',
                algorithmError: 'アルゴリズムエラーが発生しました',
                calculationError: '計算エラーが発生しました',
                initializationError: '初期化に失敗しました',
                configurationError: '設定エラーが発生しました',
                permissionError: '権限がありません',
                notSupportedError: 'この機能はサポートされていません',
                timeoutError: 'タイムアウトしました',
                unknownError: '不明なエラーが発生しました'
            },
            
            accessibility: {
                skipToContent: 'メインコンテンツへスキップ',
                mainContent: 'メインコンテンツ',
                navigation: 'ナビゲーション',
                openLanguageMenu: '言語メニューを開く',
                closeLanguageMenu: '言語メニューを閉じる',
                selectLanguage: '言語を選択',
                screenReaderOnly: 'スクリーンリーダー専用',
                loading: '読み込み中',
                required: '必須',
                invalid: '無効',
                valid: '有効',
                instructions: '操作説明',
                announcement: 'お知らせ',
                progress: '進行状況',
                step: 'ステップ',
                of: '/',
                complete: '完了',
                error: 'エラー',
                warning: '警告',
                info: '情報',
                success: '成功'
            },
            
            algorithms: {
                ternary: {
                    name: '三分探索PSAメソッド',
                    description: '効率的な三分探索アルゴリズムで最適な感度を見つけます',
                    instruction: '2つの感度を比較して選択してください',
                    features: ['高精度', '高速収束', '推奨']
                },
                natural: {
                    name: 'ナチュラルPSAメソッド',
                    description: '自然な感覚でステップバイステップで調整します',
                    instruction: '快適に感じる感度を選んで完了してください',
                    features: ['直感的', '柔軟', '初心者向け']
                }
            },
            
            tooltips: {
                dpiInfo: 'マウスのDPI設定値を入力してください',
                algorithmTernary: '効率的な三分探索で最適感度を見つけます',
                algorithmNatural: '自然な感覚で段階的に調整します',
                sensitivityRange: '現在の調整範囲を表示しています',
                copyResult: '結果をクリップボードにコピーします',
                resetApp: 'アプリケーションをリセットします',
                languageSelect: '表示言語を切り替えます',
                themeToggle: 'ダーク/ライトテーマを切り替えます',
                backStep: '前のステップに戻ります'
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
                
                step1: 'Step 1: Enter or select your mouse DPI',
                dpiLabel: 'Enter DPI value:',
                dpiPlaceholder: 'e.g., 800',
                dpiHelp: 'Please enter a DPI value between 400 and 50,000',
                dpiPresets: 'Preset DPI values:',
                startButton: 'Start sensitivity adjustment',
                
                algorithm: {
                    title: 'Algorithm Selection',
                    ternary: 'Ternary Search PSA Method',
                    natural: 'Natural PSA Method',
                    disabled: 'Cannot change after DPI selection'
                },
                
                adjustmentTitle: 'Sensitivity Adjustment',
                adjustmentTitleNatural: 'Sensitivity Adjustment',
                rangeLabel: 'Adjustment Range',
                dValueLabel: 'Base',
                comparisonInstructions: 'Try both sensitivities and choose which feels more comfortable:',
                comparisonInstructionsNatural: 'Try both sensitivities and choose the more comfortable one:',
                candidatesLabel: 'Sensitivity Comparison',
                candidateA: 'Option A',
                candidateB: 'Option B',
                leftOption: '👈 A feels better',
                rightOption: '👉 B feels better',
                equalOption: '🟰 Both are equal',
                equalOptionNatural: '✅ Complete',
                
                backButton: '🔙 Back',
                resetButton: '🔄 Reset',
                
                finishTitle: '🎉 Complete!',
                finishMessage: 'Optimal sensitivity found!',
                completeTitle: '🎯 Optimal sensitivity found!',
                finalSensitivity: 'Final sensitivity',
                copyButton: 'Copy to clipboard',
                copySuccess: 'Sensitivity value copied to clipboard!',
                copyError: 'Failed to copy',
                restartButton: 'Adjust again',
                
                settings: {
                    title: 'Settings',
                    targetSize: 'Target Size (cm)',
                    distance: 'Distance (cm)',
                    theme: 'Theme',
                    save: 'Save',
                    reset: 'Reset'
                }
            },
            
            // Notifications
            notifications: {
                welcome: 'Welcome to Valorant Mouse Sensitivity Utility!',
                dpiSelected: 'DPI value has been set',
                adjustmentStarted: 'Sensitivity adjustment started',
                adjustmentStartedWithDpi: 'Starting sensitivity adjustment. DPI: {{dpi}}',
                adjustmentCompleted: 'Sensitivity adjustment completed',
                adjustmentCompletedWithValue: 'Optimal sensitivity found: {{value}}',
                settingsSaved: 'Settings saved',
                themeChanged: 'Theme changed',
                algorithmLocked: 'Algorithm selection has been locked',
                algorithmUnlocked: 'Algorithm selection has been unlocked',
                copy: {
                    success: 'Copied to clipboard',
                    error: 'Failed to copy',
                    noValue: 'No value to copy',
                    clickToCopy: 'Click to copy'
                },
                errors: {
                    adjustmentStart: 'Error occurred during adjustment start: {{error}}',
                    invalidDpi: 'Please enter a valid DPI value (1 or higher, less than 50,000)',
                    dpiOutOfRange: 'DPI must be between {{min}} and {{max}}'
                }
            },
            
            phases: {
                setup: 'Setup',
                adjustment: 'Adjustment',
                complete: 'Complete'
            },
            
            errors: {
                dpiRequired: 'Please enter a DPI value',
                dpiInvalid: 'Please enter a valid DPI value',
                dpiRange: 'Please enter a DPI value between 400 and 50,000',
                systemError: 'A system error occurred',
                loadError: 'Failed to load data',
                saveError: 'Failed to save data',
                validationError: 'Invalid input value',
                networkError: 'A network error occurred',
                algorithmError: 'An algorithm error occurred',
                calculationError: 'A calculation error occurred',
                initializationError: 'Initialization failed',
                configurationError: 'A configuration error occurred',
                permissionError: 'Permission denied',
                notSupportedError: 'This feature is not supported',
                timeoutError: 'Request timed out',
                unknownError: 'An unknown error occurred'
            },
            
            accessibility: {
                skipToContent: 'Skip to main content',
                mainContent: 'Main content',
                navigation: 'Navigation',
                openLanguageMenu: 'Open language menu',
                closeLanguageMenu: 'Close language menu',
                selectLanguage: 'Select language',
                screenReaderOnly: 'Screen reader only',
                loading: 'Loading',
                required: 'Required',
                invalid: 'Invalid',
                valid: 'Valid',
                instructions: 'Instructions',
                announcement: 'Announcement',
                progress: 'Progress',
                step: 'Step',
                of: 'of',
                complete: 'Complete',
                error: 'Error',
                warning: 'Warning',
                info: 'Info',
                success: 'Success'
            },
            
            algorithms: {
                ternary: {
                    name: 'Ternary Search PSA Method',
                    description: 'Find optimal sensitivity with efficient ternary search algorithm',
                    instruction: 'Compare and select between two sensitivities',
                    features: ['High precision', 'Fast convergence', 'Recommended']
                },
                natural: {
                    name: 'Natural PSA Method',
                    description: 'Adjust step by step with natural feeling',
                    instruction: 'Select the sensitivity that feels comfortable and complete',
                    features: ['Intuitive', 'Flexible', 'Beginner-friendly']
                }
            },
            
            tooltips: {
                dpiInfo: 'Enter your mouse DPI setting value',
                algorithmTernary: 'Find optimal sensitivity with efficient ternary search',
                algorithmNatural: 'Adjust gradually with natural feeling',
                sensitivityRange: 'Shows current adjustment range',
                copyResult: 'Copy result to clipboard',
                resetApp: 'Reset application',
                languageSelect: 'Switch display language',
                themeToggle: 'Toggle dark/light theme',
                backStep: 'Go back to previous step'
            }
        }
    },
    
    /**
     * 翻訳キーから翻訳テキストを取得
     * @param key - 翻訳キー（ドット記法）
     * @param params - パラメータ（変数置換用）
     * @returns 翻訳されたテキスト
     */
    t(key: string, params?: Record<string, string | number>): string {
        const keys = key.split('.');
        let value: any = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                console.warn(`Translation key not found: ${key}`);
                return key;
            }
        }
        
        if (typeof value !== 'string') {
            console.warn(`Translation value is not a string: ${key}`);
            return key;
        }
        
        // パラメータの置換
        if (params) {
            return value.replace(/\{(\w+)\}/g, (match, param) => {
                return params[param] !== undefined ? String(params[param]) : match;
            });
        }
        
        return value;
    },
    
    /**
     * 言語を設定
     * @param language - 設定する言語
     */
    setLanguage(language: 'ja' | 'en'): void {
        if (language !== this.currentLanguage) {
            this.currentLanguage = language;
            this.saveLanguage();
            this.updatePageContent();
            
            // 言語変更イベントを発行
            const event = new CustomEvent('languageChanged', { 
                detail: { language: this.currentLanguage } 
            });
            document.dispatchEvent(event);
        }
    },
    
    /**
     * 現在の言語を取得
     */
    getCurrentLanguage(): 'ja' | 'en' {
        return this.currentLanguage;
    },
    
    /**
     * サポートされている言語一覧を取得
     */
    getSupportedLanguages(): string[] {
        return Object.keys(this.translations);
    },
    
    /**
     * 保存された言語設定を読み込み
     */
    loadSavedLanguage(): void {
        try {
            const saved = localStorage.getItem('app-language');
            if (saved && (saved === 'ja' || saved === 'en')) {
                this.currentLanguage = saved;
            }
        } catch (error) {
            console.warn('Failed to load saved language:', error);
        }
    },
    
    /**
     * 現在の言語設定を保存
     */
    saveLanguage(): void {
        try {
            localStorage.setItem('app-language', this.currentLanguage);
        } catch (error) {
            console.warn('Failed to save language:', error);
        }
    },
    
    /**
     * ページコンテンツを現在の言語で更新
     */
    updatePageContent(): void {
        // data-i18n属性を持つ要素の更新
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach((element: Element) => {
            const key = element.getAttribute('data-i18n');
            if (key) {
                element.textContent = this.t(key);
            }
        });

        // placeholder属性の更新
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach((element: Element) => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (key && element instanceof HTMLInputElement) {
                element.placeholder = this.t(key);
            }
        });

        // title属性の更新
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach((element: Element) => {
            const key = element.getAttribute('data-i18n-title');
            if (key) {
                element.setAttribute('title', this.t(key));
            }
        });

        // aria-label属性の更新
        const ariaElements = document.querySelectorAll('[data-i18n-aria]');
        ariaElements.forEach((element: Element) => {
            const key = element.getAttribute('data-i18n-aria');
            if (key) {
                element.setAttribute('aria-label', this.t(key));
            }
        });
    },
    
    /**
     * I18Nシステムを初期化
     */
    async init(): Promise<void> {
        // 保存された言語設定を読み込み
        this.loadSavedLanguage();
        
        // ページコンテンツを更新
        this.updatePageContent();
        
        // 初期化完了フラグ
        this.isReady = true;
        
        // カスタムイベントを発行
        const event = new CustomEvent('i18nReady', { 
            detail: { language: this.currentLanguage } 
        });
        document.dispatchEvent(event);
        
        return Promise.resolve();
    }
};

// グローバルに公開
(window as any).I18N = I18N;
