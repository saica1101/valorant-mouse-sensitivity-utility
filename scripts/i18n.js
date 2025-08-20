/**
 * Internationalization (i18n) System
 * 多言語対応システム
 */

const I18N = {
    currentLanguage: 'ja',
    
    translations: {
        ja: {
            // アプリケーション基本情報
            app: {
                title: 'VMSU',
                fullName: 'Valorant Mouse Sensitivity Utility',
                description: '最適なマウス感度を見つけましょう'
            },
            
            // UI要素
            ui: {
                title: 'Valorant Mouse Sensitivity Utility',
                subtitle: '最適なマウス感度を見つけましょう',
                language: '言語',
                version: 'バージョン',
                darkMode: 'ダークモード',
                lightMode: 'ライトモード',
                themeToggle: 'テーマを切り替える',
                
                // Step 1 - DPI設定
                step1: 'Step 1: マウスDPIを入力または選択',
                dpiLabel: 'DPI値を入力:',
                dpiPlaceholder: '例: 800',
                dpiHelp: 'DPI値は1から10000の間で入力してください',
                dpiPresets: 'プリセットDPI値:',
                startButton: '感度調整を開始',
                
                // アルゴリズム選択
                algorithm: {
                    title: 'アルゴリズム選択',
                    ternary: '三分探索PSAメソッド',
                    natural: 'ナチュラルPSAメソッド',
                    disabled: 'DPI選択後は変更できません'
                },
                
                // 調整フェーズ
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
                
                // ナビゲーション
                backButton: '🔙 戻る',
                resetButton: '🔄 Reset',
                
                // 完了フェーズ
                finishTitle: '🎉 完了！',
                finishMessage: '最適な感度が見つかりました！',
                completeTitle: '🎯 最適な感度が見つかりました！',
                finalSensitivity: '最終感度',
                copyButton: 'クリップボードにコピー',
                copySuccess: '感度値がクリップボードにコピーされました！',
                copyError: 'コピーに失敗しました',
                restartButton: 'もう一度調整する',
                
                // 設定
                settings: {
                    title: '設定',
                    targetSize: 'ターゲットサイズ (cm)',
                    distance: '距離 (cm)',
                    theme: 'テーマ',
                    save: '保存',
                    reset: 'リセット'
                },
                
                // 統計情報
                stats: {
                    title: '統計情報',
                    iterations: '繰り返し回数',
                    accuracy: '精度',
                    timeSpent: '所要時間'
                }
            },
            
            // エラーメッセージ
            errors: {
                invalidDPI: '有効なDPI値を入力してください (1-10000)',
                dpiRequired: 'DPI値の入力が必要です',
                adjustmentError: '調整中にエラーが発生しました',
                configError: '設定エラー',
                configLoadFailed: '設定ファイルの読み込みに失敗しました。アプリケーションを再起動してください。',
                appError: 'アプリケーションエラー',
                initError: 'アプリケーションの初期化中にエラーが発生しました'
            },
            
            // アクセシビリティ
            a11y: {
                dpiInputDescription: 'マウスのDPI値を入力するためのテキストフィールドです',
                dpiButtonDescription: 'プリセットDPI値を選択するボタンです',
                startButtonDescription: '感度調整を開始するボタンです',
                adjustmentButtonDescription: '感度候補を選択するボタンです',
                resetButtonDescription: '調整をリセットして最初から始めるボタンです',
                themeToggleDescription: 'ダークモードとライトモードを切り替えるボタンです',
                candidateDescription: '感度候補を示すラベルです',
                finalResultDescription: '最終的な感度値を示すラベルです'
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
                    dpiOutOfRange: 'DPIは{{min}}〜{{max}}の範囲で入力してください'
                }
            },
            
            // メニュー項目（メインプロセス用）
            menu: {
                mFileMenu: 'ファイル',
                mOptionMenu: 'オプション',
                mLanguageMenu: '言語',
                mAlgorithmMenu: 'アルゴリズム',
                mExitProgram: 'プログラムを終了する',
                mProgramLanguage: '日本語'
            }
        },
        
        en: {
            // Application basic info
            app: {
                title: 'VMSU',
                fullName: 'Valorant Mouse Sensitivity Utility',
                description: 'Find your optimal mouse sensitivity'
            },
            
            // UI elements
            ui: {
                title: 'Valorant Mouse Sensitivity Utility',
                subtitle: 'Find your optimal mouse sensitivity',
                language: 'Language',
                version: 'Version',
                darkMode: 'Dark Mode',
                lightMode: 'Light Mode',
                themeToggle: 'Toggle Theme',
                
                // Step 1 - DPI settings
                step1: 'Step 1: Enter or select your mouse DPI',
                dpiLabel: 'Enter DPI value:',
                dpiPlaceholder: 'e.g., 800',
                dpiHelp: 'Please enter a DPI value between 1 and 10000',
                dpiPresets: 'Preset DPI values:',
                startButton: 'Start sensitivity adjustment',
                
                // Algorithm selection
                algorithm: {
                    title: 'Algorithm Selection',
                    ternary: 'Ternary search PSA method',
                    natural: 'Natural PSA method',
                    disabled: 'Cannot change after DPI selection'
                },
                
                // Adjustment Phase
                adjustmentTitle: 'Sensitivity Adjustment',
                adjustmentTitleNatural: 'Sensitivity Adjustment',
                rangeLabel: 'Adjustment Range',
                dValueLabel: 'Base',
                comparisonInstructions: 'Try both sensitivities and choose which one feels more comfortable:',
                comparisonInstructionsNatural: 'Try both sensitivities and choose the more comfortable one:',
                candidatesLabel: 'Sensitivity Candidate Comparison',
                candidateA: 'Candidate A',
                candidateB: 'Candidate B',
                leftOption: '👈 A is comfortable',
                rightOption: '👉 B is comfortable',
                equalOption: '🟰 Both are same',
                
                // Navigation
                backButton: '🔙 Back',
                resetButton: '🔄 Reset',
                
                // Complete Phase
                finishTitle: '🎉 Finished!',
                finishMessage: 'Your optimal sensitivity has been found!',
                completeTitle: '🎯 Optimal sensitivity found!',
                finalSensitivity: 'Final sensitivity',
                copyButton: 'Copy to clipboard',
                copySuccess: 'Sensitivity value copied to clipboard!',
                copyError: 'Failed to copy',
                restartButton: 'Adjust again',
                
                // Settings
                settings: {
                    title: 'Settings',
                    targetSize: 'Target size (cm)',
                    distance: 'Distance (cm)',
                    theme: 'Theme',
                    save: 'Save',
                    reset: 'Reset'
                },
                
                // Statistics
                stats: {
                    title: 'Statistics',
                    iterations: 'Iterations',
                    accuracy: 'Accuracy',
                    timeSpent: 'Time spent'
                }
            },
            
            // Error messages
            errors: {
                invalidDPI: 'Please enter a valid DPI value (1-10000)',
                dpiRequired: 'DPI value is required',
                adjustmentError: 'An error occurred during adjustment',
                configError: 'Configuration error',
                configLoadFailed: 'Failed to load configuration file. Please restart the application.',
                appError: 'Application error',
                initError: 'An error occurred during application initialization'
            },
            
            // Accessibility
            a11y: {
                dpiInputDescription: 'Text field for entering your mouse DPI value',
                dpiButtonDescription: 'Button to select a preset DPI value',
                startButtonDescription: 'Button to start sensitivity adjustment',
                adjustmentButtonDescription: 'Button to select a sensitivity candidate',
                resetButtonDescription: 'Button to reset the adjustment and start over',
                themeToggleDescription: 'Button to toggle between dark and light modes',
                candidateDescription: 'Label showing a sensitivity candidate',
                finalResultDescription: 'Label showing the final sensitivity value'
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
            
            // Menu items (for main process)
            menu: {
                mFileMenu: 'File',
                mOptionMenu: 'Option',
                mLanguageMenu: 'Language',
                mAlgorithmMenu: 'Algorithm',
                mExitProgram: 'Exit Program',
                mProgramLanguage: 'English'
            }
        }
    },

    /**
     * 翻訳テキストを取得
     * @param {string} key - 翻訳キー（ドット記法: 'ui.title'）
     * @param {Object} params - 置換パラメーター
     * @returns {string} 翻訳されたテキスト
     */
    t(key, params = {}) {
        try {
            const keys = key.split('.');
            let value = this.translations[this.currentLanguage];
            
            for (const k of keys) {
                value = value?.[k];
            }
            
            if (typeof value === 'string') {
                // パラメーター置換
                return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
                    return params[param] || match;
                });
            }
            
            // フォールバック: 日本語版を試す
            if (this.currentLanguage !== 'ja') {
                let fallback = this.translations.ja;
                for (const k of keys) {
                    fallback = fallback?.[k];
                }
                if (typeof fallback === 'string') {
                    return fallback.replace(/\{\{(\w+)\}\}/g, (match, param) => {
                        return params[param] || match;
                    });
                }
            }
            
            return key; // 翻訳が見つからない場合はキーをそのまま返す
        } catch (error) {
            return key;
        }
    },

    /**
     * 言語を設定
     * @param {string} language - 言語コード ('ja' | 'en')
     */
    setLanguage(language) {
        if (this.translations[language]) {
            this.currentLanguage = language;
            this.saveLanguage();
            this.updatePageContent();
        }
    },

    /**
     * 言語設定を保存
     */
    saveLanguage() {
        try {
            localStorage.setItem('vmsu-language', this.currentLanguage);
        } catch (error) {
            // Failed to save language preference
        }
    },

    /**
     * 保存された言語設定を読み込み
     */
    loadSavedLanguage() {
        try {
            const saved = localStorage.getItem('vmsu-language');
            if (saved && this.translations[saved]) {
                this.currentLanguage = saved;
            }
        } catch (error) {
            // Failed to load saved language, use default
        }
    },

    /**
     * ページコンテンツを更新
     */
    updatePageContent() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translatedText = this.t(key);
            
            if (element.tagName === 'INPUT' && element.type !== 'button' && element.type !== 'submit') {
                element.placeholder = translatedText;
            } else {
                element.textContent = translatedText;
            }
        });

        // title属性の更新
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // aria-label属性の更新
        const ariaElements = document.querySelectorAll('[data-i18n-aria]');
        ariaElements.forEach(element => {
            const key = element.getAttribute('data-i18n-aria');
            element.setAttribute('aria-label', this.t(key));
        });
    }
};

// グローバルに公開
window.I18N = I18N;
