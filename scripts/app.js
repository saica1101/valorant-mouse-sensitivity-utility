/**
 * Valorant Mouse Sensitivity Utility - Ternary Search Algorithm
 * マウス感度調整アプリケーション - 三分探索アルゴリズム
 */

/**
 * エラー表示ユーティリティクラス
 */
class ErrorDisplay {
    /**
     * 致命的なエラーを表示
     * @param {string} title - エラータイトル
     * @param {string} message - エラーメッセージ
     * @param {string} actionText - アクションボタンのテキスト
     * @param {Function} actionCallback - アクションボタンのコールバック
     */
    static showFatalError(title, message, actionText = 'リロード', actionCallback = () => location.reload()) {
        document.body.innerHTML = `
               
        // DPI選択後はアルゴリズムをロック（通知なし）
        await this.lockAlgorithmSelection(false);  <div class="fatal-error-container">
                <div class="fatal-error-content">
                    <div class="error-icon">⚠️</div>
                    <h2 class="error-title">${title}</h2>
                    <p class="error-message">${message}</p>
                    <button class="error-action-btn" onclick="(${actionCallback.toString()})()">${actionText}</button>
                </div>
            </div>
            <style>
                .fatal-error-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 20px;
                }
                .fatal-error-content {
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    text-align: center;
                    max-width: 400px;
                    animation: slideIn 0.3s ease-out;
                }
                .error-icon {
                    font-size: 48px;
                    margin-bottom: 20px;
                }
                .error-title {
                    color: #e74c3c;
                    margin-bottom: 16px;
                    font-size: 24px;
                    font-weight: 600;
                }
                .error-message {
                    color: #666;
                    margin-bottom: 24px;
                    line-height: 1.5;
                }
                .error-action-btn {
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background 0.3s ease;
                }
                .error-action-btn:hover {
                    background: #2980b9;
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
        `;
    }
}

class MouseSensitivityUtility {
    constructor() {
        try {
            // 設定を外部化
            this.config = window.CONFIG;
            
            if (!this.config) {
                ErrorDisplay.showFatalError(
                    window.I18N?.t('errors.configError') || '設定エラー',
                    window.I18N?.t('errors.configLoadFailed') || '設定ファイルの読み込みに失敗しました。アプリケーションを再起動してください。'
                );
                return;
            }
            
            // システムマネージャーの初期化
            this.initializeManagers();
            
            // アルゴリズム関連
            this.inputDPI = 0;
            this.lowerBound = 0;
            this.upperBound = 0;
            this.leftThird = 0;  // 三分探索の左側候補
            this.rightThird = 0; // 三分探索の右側候補
            this.currentAlgorithm = 'ternary'; // デフォルトは三分探索
            this.algorithmLocked = false; // DPI選択後にロック
            
            this.initializeElements();
            this.bindEvents();
            this.initializeTheme();
            this.loadAppVersion();
            
            // アクセシビリティの設定
            this.setupAccessibility();
            
            // メニューからの言語変更リスナーを設定
            this.setupMenuLanguageListener();
            
            // メニューからのアルゴリズム変更リスナーを設定  
            this.setupMenuAlgorithmListener();
            
            // 初期アルゴリズム設定を読み込み
            this.loadAlgorithmFromMain();
            
        } catch (error) {
            ErrorDisplay.showFatalError(
                window.I18N?.t('errors.appError') || 'アプリケーションエラー',
                `${window.I18N?.t('errors.initError') || 'アプリケーションの初期化中にエラーが発生しました'}: ${error.message}`
            );
        }
    }
    
    /**
     * システムマネージャーの初期化
     */
    initializeManagers() {
        try {
            // 多言語サポートの初期化
            if (window.I18N && typeof window.I18N.loadSavedLanguage === 'function') {
                this.loadLanguageFromMain();
            }
            
            // アクセシビリティマネージャーの初期化
            if (window.AccessibilityManager) {
                try {
                    this.accessibilityManager = new AccessibilityManager();
                } catch (error) {
                    this.accessibilityManager = null;
                }
            } else {
                this.accessibilityManager = null;
            }
            
            // パフォーマンスマネージャーの初期化
            if (window.PerformanceManager) {
                try {
                    this.performanceManager = new PerformanceManager();
                } catch (error) {
                    this.performanceManager = null;
                }
            } else {
                this.performanceManager = null;
            }
        } catch (error) {
            // フォールバック: 基本的な機能のみ提供
            this.accessibilityManager = null;
            this.performanceManager = null;
        }
    }
    
    /**
     * メインプロセスから言語設定を読み込み
     */
    async loadLanguageFromMain() {
        try {
            if (window.electronAPI && window.electronAPI.getLanguage) {
                const language = await window.electronAPI.getLanguage();
                if (window.I18N && language) {
                    window.I18N.setLanguage(language);
                }
            }
        } catch (error) {
            // フォールバック: 保存された言語設定を使用
            if (window.I18N && typeof window.I18N.loadSavedLanguage === 'function') {
                window.I18N.loadSavedLanguage();
            }
        }
    }
    
    /**
     * メインプロセスからアルゴリズム設定を読み込み
     */
    async loadAlgorithmFromMain() {
        try {
            if (window.electronAPI && window.electronAPI.getAlgorithm) {
                const algorithm = await window.electronAPI.getAlgorithm();
                if (algorithm) {
                    this.currentAlgorithm = algorithm;
                    this.updateAlgorithmDisplay();
                }
            }
        } catch (error) {
            // フォールバック: デフォルトの三分探索を使用
            this.currentAlgorithm = 'ternary';
        }
    }
    
    /**
     * メニューからの言語変更リスナーを設定
     */
    setupMenuLanguageListener() {
        if (window.electronAPI && window.electronAPI.onLanguageChanged) {
            window.electronAPI.onLanguageChanged((event, language) => {
                if (window.I18N) {
                    // メニューからの変更の場合は循環参照を防ぐためメインプロセス通知をスキップ
                    this.isMenuTriggered = true;
                    window.I18N.setLanguage(language, { skipMainProcess: true });
                    this.isMenuTriggered = false;
                    // 言語変更時にアルゴリズム表示も更新
                    this.updateAlgorithmDisplay();
                    // 言語変更時にボタンテキストも更新
                    this.updateEqualButtonForAlgorithm();
                }
            });
        }
    }
    
    /**
     * メニューからのアルゴリズム変更リスナーを設定
     */
    setupMenuAlgorithmListener() {
        if (window.electronAPI && window.electronAPI.onAlgorithmChanged) {
            window.electronAPI.onAlgorithmChanged((event, algorithm) => {
                if (!this.algorithmLocked) {
                    this.currentAlgorithm = algorithm;
                    this.updateAlgorithmDisplay();
                    // アルゴリズム変更時にボタンテキストも更新
                    this.updateEqualButtonForAlgorithm();
                } else {
                    // DPI選択後はアルゴリズムを変更できません
                }
            });
        }
    }
    
    /**
     * アルゴリズム表示を更新
     */
    updateAlgorithmDisplay() {
        // アルゴリズム表示があれば更新
        const algorithmDisplay = document.getElementById('currentAlgorithm');
        if (algorithmDisplay && window.I18N) {
            const algorithmName = this.currentAlgorithm === 'ternary' 
                ? window.I18N.t('ui.algorithm.ternary')
                : window.I18N.t('ui.algorithm.natural');
            algorithmDisplay.textContent = algorithmName;
        }
    }

    /**
     * DOM要素の初期化
     */
    initializeElements() {
        // パフォーマンスマネージャーがある場合のみキャッシュを使用
        let elements = {};
        
        if (this.performanceManager && typeof this.performanceManager.cacheElements === 'function') {
            try {
                elements = this.performanceManager.cacheElements([
                    'dpiInput', 'startBtn', 'leftBtn', 'rightBtn', 'equalBtn',
                    'backBtn', 'resetBtn', 'themeToggle', 'version', 'notificationContainer',
                    'setupPhase', 'backPhase', 'adjustmentPhase', 'finishPhase',
                    'leftCandidate', 'rightCandidate', 'finalSensitivity',
                    'lowerBound', 'upperBound', 'languageSelector'
                ]);
            } catch (error) {
                elements = {};
            }
        }
        
        this.elements = elements;
        
        // 直接アクセス用のプロパティ（後方互換性とフォールバック）
        this.dpiInput = elements.dpiInput || document.getElementById('dpiInput');
        this.dpiButtons = document.querySelectorAll('.dpi-btn');
        this.startBtn = elements.startBtn || document.getElementById('startBtn');
        this.leftBtn = elements.leftBtn || document.getElementById('leftBtn');
        this.rightBtn = elements.rightBtn || document.getElementById('rightBtn');
        this.equalBtn = elements.equalBtn || document.getElementById('equalBtn');
        this.backBtn = elements.backBtn || document.getElementById('backBtn');
        this.resetBtn = elements.resetBtn || document.getElementById('resetBtn');
        this.themeToggle = elements.themeToggle || document.getElementById('themeToggle');
        this.versionElement = elements.version || document.getElementById('version');
        this.notificationContainer = elements.notificationContainer || document.getElementById('notificationContainer');
        
        this.setupPhase = elements.setupPhase || document.getElementById('setupPhase');
        this.backPhase = elements.backPhase || document.getElementById('backPhase');
        this.adjustmentPhase = elements.adjustmentPhase || document.getElementById('adjustmentPhase');
        this.finishPhase = elements.finishPhase || document.getElementById('finishPhase');
        
        this.leftCandidate = elements.leftCandidate || document.getElementById('leftCandidate');
        this.rightCandidate = elements.rightCandidate || document.getElementById('rightCandidate');
        this.finalSensitivity = elements.finalSensitivity || document.getElementById('finalSensitivity');
        this.lowerBoundDisplay = elements.lowerBound || document.getElementById('lowerBound');
        this.upperBoundDisplay = elements.upperBound || document.getElementById('upperBound');
        this.languageSelector = elements.languageSelector || document.getElementById('languageSelector');
    }
    
    /**
     * アクセシビリティ設定
     */
    setupAccessibility() {
        if (!this.accessibilityManager) return;
        
        try {
            // キーボードナビゲーションの設定
            if (typeof this.accessibilityManager.setupKeyboardNavigation === 'function') {
                this.accessibilityManager.setupKeyboardNavigation();
            }
            
            // 高コントラストモードの設定
            if (typeof this.accessibilityManager.setupHighContrast === 'function') {
                this.accessibilityManager.setupHighContrast();
            }
            
            // スクリーンリーダー用のライブリージョンの設定
            if (typeof this.accessibilityManager.setupLiveRegions === 'function') {
                this.accessibilityManager.setupLiveRegions();
            }
            
            // ボタンにアクセシビリティ属性を追加
            this.setupButtonAccessibility();
        } catch (error) {
            // アクセシビリティ設定中にエラーが発生しました
        }
    }
    
    /**
     * ボタンのアクセシビリティ設定
     */
    setupButtonAccessibility() {
        if (!this.accessibilityManager || typeof this.accessibilityManager.addAriaLabel !== 'function') {
            return;
        }
        
        const buttons = [
            { element: this.startBtn, labelKey: 'ui.startButton' },
            { element: this.leftBtn, labelKey: 'ui.leftOption' },
            { element: this.rightBtn, labelKey: 'ui.rightOption' },
            { element: this.equalBtn, labelKey: 'ui.equalOption' },
            { element: this.backBtn, labelKey: 'ui.backButton' },
            { element: this.resetBtn, labelKey: 'ui.resetButton' },
            { element: this.themeToggle, labelKey: 'ui.themeToggle' }
        ];
        
        buttons.forEach(({ element, labelKey }) => {
            if (element && window.I18N) {
                try {
                    this.accessibilityManager.addAriaLabel(element, window.I18N.t(labelKey));
                } catch (error) {
                    // ボタンのアクセシビリティ設定に失敗しました
                }
            }
        });
    }

    /**
     * イベントリスナーのバインド
     */
    bindEvents() {
        // パフォーマンス最適化されたイベントハンドリング
        if (this.performanceManager && typeof this.performanceManager.optimizeEvents === 'function') {
            try {
                this.performanceManager.optimizeEvents();
            } catch (error) {
                // イベント最適化の設定に失敗しました
            }
        }
        
        this.dpiButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectDPI(btn));
        });

        this.dpiInput.addEventListener('input', () => {
            this.dpiButtons.forEach(btn => btn.classList.remove('active'));
        });

        this.startBtn.addEventListener('click', () => this.startAdjustment());
        this.leftBtn.addEventListener('click', () => this.ternaryChoice('left'));
        this.rightBtn.addEventListener('click', () => this.ternaryChoice('right'));
        this.equalBtn.addEventListener('click', () => this.ternaryChoice('equal'));
        this.backBtn.addEventListener('click', () => this.reset());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // 最終感度のクリックでコピー機能
        if (this.finalSensitivity) {
            this.finalSensitivity.addEventListener('click', () => this.copyFinalSensitivity());
            // カーソルをポインターに変更するためのスタイル追加
            this.finalSensitivity.style.cursor = 'pointer';
            this.finalSensitivity.title = window.I18N && window.I18N.t ? 
                window.I18N.t('notifications.copy.clickToCopy') : 'クリックでコピー';
        }
        
        // 言語セレクターのイベント
        if (this.languageSelector && window.I18N) {
            this.languageSelector.addEventListener('change', async (e) => {
                await window.I18N.setLanguage(e.target.value);
                this.updateUILanguage();
            });
        }
        
        // キーボードイベント（アクセシビリティ）
        this.setupKeyboardEvents();
    }
    
    /**
     * キーボードイベントの設定
     */
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // Escキーでリセット
            if (e.key === 'Escape') {
                this.reset();
            }
            
            // Enterキーで主要アクション実行
            if (e.key === 'Enter' && e.target.tagName === 'BUTTON') {
                e.target.click();
            }
        });
    }
    
    /**
     * UIの言語更新
     */
    updateUILanguage() {
        if (!window.I18N) return;
        
        // テキスト要素の更新
        const textElements = document.querySelectorAll('[data-i18n]');
        textElements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key) {
                element.textContent = window.I18N.t(key);
            }
        });
        
        // プレースホルダーの更新
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (key) {
                element.placeholder = window.I18N.t(key);
            }
        });
        
        // 最終感度のタイトル更新
        if (this.finalSensitivity) {
            this.finalSensitivity.title = window.I18N.t('notifications.copy.clickToCopy') || 'クリックでコピー';
        }
        
        // アクセシビリティラベルの更新
        this.setupButtonAccessibility();
        
        // アルゴリズム表示の更新
        this.updateAlgorithmDisplay();
        
        // テーマボタンの表示を現在のテーマに合わせて更新
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        this.setTheme(currentTheme);
    }

    /**
     * テーマの初期化
     */
    initializeTheme() {
        const savedTheme = localStorage.getItem(this.config.THEME.STORAGE_KEY) || this.config.THEME.DEFAULT;
        this.setTheme(savedTheme);
    }

    /**
     * テーマの切り替え
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * テーマの設定
     * @param {string} theme - 'light' または 'dark'
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.config.THEME.STORAGE_KEY, theme);
        
        // i18nシステムを使用してテーマボタンのテキストを更新
        if (window.I18N && this.themeToggle) {
            const icon = theme === 'dark' ? '☀️' : '🌙';
            const textKey = theme === 'dark' ? 'ui.lightMode' : 'ui.darkMode';
            const text = window.I18N.t(textKey);
            
            // span要素を取得または作成
            let spanElement = this.themeToggle.querySelector('span[data-i18n]');
            if (!spanElement) {
                spanElement = document.createElement('span');
                spanElement.setAttribute('data-i18n', textKey);
                this.themeToggle.innerHTML = '';
                this.themeToggle.appendChild(document.createTextNode(icon + ' '));
                this.themeToggle.appendChild(spanElement);
            } else {
                // アイコンを更新
                this.themeToggle.childNodes[0].textContent = icon + ' ';
                // data-i18n属性を更新
                spanElement.setAttribute('data-i18n', textKey);
            }
            
            // テキストを更新
            spanElement.textContent = text;
        } else {
            // フォールバック: i18nが利用できない場合
            this.themeToggle.textContent = theme === 'dark' ? '☀️ ライトモード' : '🌙 ダークモード';
        }
    }

    /**
     * アプリケーションバージョンの動的読み込み
     */
    async loadAppVersion() {
        try {
            if (!this.versionElement) {
                // バージョン要素が見つかりません
                return;
            }
            
            // 最初にフォールバック版を設定
            this.versionElement.textContent = this.config.APP.FALLBACK_VERSION;
            
            // Electron APIが利用可能な場合、実際のバージョンを取得
            if (window.electronAPI && window.electronAPI.getVersion) {
                const version = await window.electronAPI.getVersion();
                this.versionElement.textContent = `v${version}`;
                
                // バージョン不整合の検出と警告
                const expectedVersion = this.config.APP.FALLBACK_VERSION.replace('v', '');
                if (version !== expectedVersion) {
                    // バージョン不整合が検出されました
                }
            }
        } catch (error) {
            if (this.versionElement) {
                this.versionElement.textContent = this.config.APP.FALLBACK_VERSION;
            }
        }
    }

    /**
     * DPIボタンの選択
     * @param {HTMLElement} button - 選択されたDPIボタン
     */
    selectDPI(button) {
        this.dpiButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.dpiInput.value = button.dataset.dpi;
    }
    
    /**
     * アルゴリズム選択をロック
     * @param {boolean} showNotification - 通知を表示するかどうか（デフォルト: false）
     */
    async lockAlgorithmSelection(showNotification = false) {
        this.algorithmLocked = true;
        
        // メニューの無効化をメインプロセスに通知
        if (window.electronAPI && window.electronAPI.lockAlgorithmSelection) {
            try {
                await window.electronAPI.lockAlgorithmSelection();
                
                // オプションで通知を表示
                if (showNotification) {
                    const message = window.I18N ? 
                        window.I18N.t('notifications.algorithmLocked') : 
                        'アルゴリズム選択がロックされました';
                    this.showNotification(message, 'info');
                }
            } catch (error) {
                // メニューロックの通知に失敗しました
            }
        }
    }

    /**
     * 通知の表示
     * @param {string} message - 表示するメッセージ
     * @param {string} type - 通知の種類 ('success', 'error', 'info', 'warning')
     * @param {number} duration - 表示時間（ミリ秒）
     */
    showNotification(message, type = 'info', duration = null) {
        try {
            if (!this.notificationContainer) {
                return;
            }
            
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            
            this.notificationContainer.appendChild(notification);
            
            // アニメーション用のタイムアウト
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
            
            // 表示時間の設定
            const displayDuration = duration || 
                (type === 'error' ? this.config.UI.ERROR_DISPLAY_DURATION : this.config.UI.SUCCESS_DISPLAY_DURATION);
            
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, this.config.UI.ANIMATION_DURATION);
                }
            }, displayDuration);
        } catch (error) {
            // 通知表示エラー
        }
    }

    /**
     * エラー表示
     * @param {string} message - エラーメッセージ
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * 成功表示
     * @param {string} message - 成功メッセージ
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * 指定された小数点以下の桁数で繰り上げ丸めを行う
     * @param {number} value - 丸める値
     * @param {number} decimals - 小数点以下の桁数
     * @returns {number} 丸められた値
     */
    roundUp(value, decimals) {
        const multiplier = Math.pow(10, decimals);
        return Math.ceil(value * multiplier) / multiplier;
    }

    /**
     * 最終感度をクリップボードにコピー
     */
    async copyFinalSensitivity() {
        try {
            const finalValue = this.finalSensitivity?.textContent || this.finalSensitivity;
            if (!finalValue) {
                const message = window.I18N ? window.I18N.t('notifications.copy.noValue') : 'コピーする値がありません';
                this.showError(message);
                return;
            }
            
            // クリップボードにコピー
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(finalValue.toString());
            } else {
                // フォールバック: execCommand使用
                const textArea = document.createElement('textarea');
                textArea.value = finalValue.toString();
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            
            const message = window.I18N ? window.I18N.t('notifications.copy.success') : 'クリップボードにコピーしました';
            this.showSuccess(message);
        } catch (error) {
            const message = window.I18N ? window.I18N.t('notifications.copy.error') : 'コピーに失敗しました';
            this.showError(message);
        }
    }

    /**
     * 感度調整の開始
     */
    async startAdjustment() {
        const dpiValue = parseInt(this.dpiInput.value);
        
        if (!this.validateDPIInput(dpiValue)) {
            return;
        }

        try {
            this.inputDPI = dpiValue;
            
            // DPI入力後はアルゴリズムをロック（通知あり）
            await this.lockAlgorithmSelection(true);
            
            // 仕様に基づく計算
            this.lowerBound = this.config.BASE_SENSI / this.inputDPI;
            this.upperBound = this.lowerBound * this.config.ALGORITHM.RANGE_MULTIPLIER;
            
            // アルゴリズムに応じた初期化
            if (this.currentAlgorithm === 'ternary') {
                this.calculateTernaryPoints();
            } else if (this.currentAlgorithm === 'natural') {
                this.initializeNaturalPSA();
            }

            // i18n対応の通知
            const message = window.I18N ? 
                window.I18N.t('notifications.adjustmentStartedWithDpi', { dpi: dpiValue }) : 
                `感度調整を開始します。DPI: ${dpiValue}`;
            this.showSuccess(message);
            
            // UI更新
            this.updateAdjustmentTitle();
            this.showAdjustmentPhase();
            this.updateDisplay();
            this.updateEqualButtonForAlgorithm();
        } catch (error) {
            const message = window.I18N ? 
                window.I18N.t('notifications.errors.adjustmentStart', { error: error.message }) : 
                `調整開始中にエラーが発生しました: ${error.message}`;
            this.showError(message);
        }
    }

    /**
     * DPI入力値の検証
     * @param {number} dpiValue - DPI値
     * @returns {boolean} 検証結果
     */
    validateDPIInput(dpiValue) {
        if (!dpiValue || dpiValue <= 0 || isNaN(dpiValue)) {
            const message = window.I18N ? 
                window.I18N.t('notifications.errors.invalidDpi') : 
                '正しいDPI値を入力してください（1以上50,000未満）';
            this.showError(message);
            return false;
        }
        
        if (dpiValue < this.config.VALIDATION.MIN_DPI || dpiValue > this.config.VALIDATION.MAX_DPI) {
            const message = window.I18N ? 
                window.I18N.t('notifications.errors.dpiOutOfRange', { 
                    min: this.config.VALIDATION.MIN_DPI, 
                    max: this.config.VALIDATION.MAX_DPI 
                }) : 
                `DPIは${this.config.VALIDATION.MIN_DPI}〜${this.config.VALIDATION.MAX_DPI}の範囲で入力してください`;
            this.showError(message);
            return false;
        }
        
        return true;
    }

    /**
     * 三分探索の分割点を計算
     */
    calculateTernaryPoints() {
        // 三分探索: 範囲を3つに分割して、1/3と2/3の位置を計算
        const range = this.upperBound - this.lowerBound;
        this.leftThird = this.lowerBound + range / 3;
        this.rightThird = this.lowerBound + (2 * range) / 3;
    }
    
    /**
     * ナチュラルPSAメソッドの初期化
     */
    initializeNaturalPSA() {
        // 仮感度A = 280 / input_DPI
        this.naturalBaseA = 280 / this.inputDPI;
        
        // 初期のd値はA
        this.currentD = this.naturalBaseA;
        
        // 試行回数を初期化
        this.naturalIteration = 0;
        
        // 試行回数に応じた乗算値を取得
        const multipliers = this.getNaturalMultipliers(this.naturalIteration);
        
        // b = d * 低い乗算値, c = d * 高い乗算値
        this.leftThird = this.roundUp(this.currentD * multipliers.low, 3);
        this.rightThird = this.roundUp(this.currentD * multipliers.high, 3);
        
        this.showAdjustmentPhase();
        this.updateDisplay();
        this.updateEqualButtonForAlgorithm();
    }
    
    /**
     * Natural PSA メソッドの試行回数に応じた乗算値を取得
     * @param {number} iteration - 現在の試行回数
     * @returns {Object} 低い乗算値と高い乗算値のオブジェクト
     */
    getNaturalMultipliers(iteration) {
        // 表示回数に応じた乗算値のテーブル
        // iteration 0: 初期表示（1回目）
        // iteration 1: 1回目選択後（2回目表示）
        // iteration 2: 2回目選択後（3回目表示）
        // ...
        const multiplierTable = [
            { low: 0.5, high: 1.5 },   // 1回目表示 (iteration 0)
            { low: 0.5, high: 1.5 },   // 2回目表示 (iteration 1)
            { low: 0.6, high: 1.4 },   // 3回目表示 (iteration 2)
            { low: 0.7, high: 1.3 },   // 4回目表示 (iteration 3)
            { low: 0.8, high: 1.2 },   // 5回目表示 (iteration 4)
            { low: 0.9, high: 1.1 },   // 6回目表示 (iteration 5)
            { low: 0.95, high: 1.05 }  // 7回目表示 (iteration 6)
        ];
        
        // 実際に使用する乗算値を決定
        const index = Math.min(iteration, 6);
        const result = multiplierTable[index];
        
        return result;
    }

    /**
     * 調整タイトルを更新
     */
    updateAdjustmentTitle() {
        const titleElement = document.getElementById('adjustmentTitle');
        if (titleElement && window.I18N) {
            const titleKey = this.currentAlgorithm === 'ternary' 
                ? 'ui.adjustmentTitle' 
                : 'ui.adjustmentTitleNatural';
            titleElement.textContent = window.I18N.t(titleKey);
        }
    }

    /**
     * アルゴリズムに応じてequalボタンのテキストを更新
     */
    updateEqualButtonForAlgorithm() {
        if (this.equalBtn && window.I18N) {
            const textKey = this.currentAlgorithm === 'natural' 
                ? 'ui.equalOptionNatural' 
                : 'ui.equalOption';
            this.equalBtn.textContent = window.I18N.t(textKey);
            
            // アクセシビリティ属性も更新
            if (this.accessibilityManager && typeof this.accessibilityManager.addAriaLabel === 'function') {
                try {
                    this.accessibilityManager.addAriaLabel(this.equalBtn, window.I18N.t(textKey));
                } catch (error) {
                    console.warn('アクセシビリティラベルの更新に失敗:', error);
                }
            }
        }
    }

    /**
     * アルゴリズム別の選択処理
     * @param {string} choice - 'left', 'right', または 'equal'
     */
    ternaryChoice(choice) {
        console.log(`[DEBUG] ternaryChoice called: choice=${choice}, algorithm=${this.currentAlgorithm}`);
        if (this.currentAlgorithm === 'ternary') {
            console.log('[DEBUG] 三分探索の選択処理を実行');
            this.handleTernaryChoice(choice);
        } else if (this.currentAlgorithm === 'natural') {
            console.log('[DEBUG] Natural PSAの選択処理を実行');
            this.handleNaturalChoice(choice);
        } else {
            console.log(`[DEBUG] 未対応のアルゴリズム: ${this.currentAlgorithm}`);
        }
    }
    
    /**
     * 三分探索の選択処理
     * @param {string} choice - 'left', 'right', または 'equal'
     */
    handleTernaryChoice(choice) {
        if (choice === 'left') {
            // 左側（小さい値）が好まれる場合：右境界を左候補に移動
            this.upperBound = this.rightThird;
        } else if (choice === 'right') {
            // 右側（大きい値）が好まれる場合：左境界を右候補に移動
            this.lowerBound = this.leftThird;
        } else if (choice === 'equal') {
            // 同じ場合：中間範囲のみを残す（両端を狭める）
            this.lowerBound = this.leftThird;
            this.upperBound = this.rightThird;
        }

        // 収束チェック
        const range = this.upperBound - this.lowerBound;
        if (range < this.config.ALGORITHM.CONVERGENCE_THRESHOLD) {
            this.finalSensitivity = (this.lowerBound + this.upperBound) / 2;
            this.showFinishPhase();
        } else {
            this.calculateTernaryPoints();
            this.updateDisplay();
        }
    }
    
    /**
     * ナチュラルPSAメソッドの選択処理
     * @param {string} choice - 'left', 'right', または 'equal'
     */
    handleNaturalChoice(choice) {
        if (choice === 'equal') {
            // 両方同じ場合は終了
            this.finalSensitivity = (this.leftThird + this.rightThird) / 2;
            this.showFinishPhase();
            return;
        }
        
        // 7回目の選択で終了
        if (this.naturalIteration >= 6) {
            // 7回目の選択された感度を最終感度とする
            this.finalSensitivity = choice === 'left' ? this.leftThird : this.rightThird;
            this.showFinishPhase();
            return;
        }
        
        // 選択された値を取得
        const selectedValue = choice === 'left' ? this.leftThird : this.rightThird;
        
        // 正しい仕様: 新しいd値 = (選択された値 + 基準値) / 2
        // 1回目の選択後: (選択された値 + A) / 2
        // 2回目以降の選択後: (選択された値 + 前回のd) / 2
        const previousD = this.currentD;
        this.currentD = (selectedValue + previousD) / 2;
        
        // 試行回数をインクリメント（選択処理完了後）
        this.naturalIteration++;
        
        // 現在の試行回数に基づいて次の乗算値を取得
        const multipliers = this.getNaturalMultipliers(this.naturalIteration);
        
        // 新しいペアを生成: d*低乗算値 と d*高乗算値 (小数第3位以降は繰り上げ)
        this.leftThird = this.roundUp(this.currentD * multipliers.low, 3);
        this.rightThird = this.roundUp(this.currentD * multipliers.high, 3);
        
        // 表示を更新
        this.updateDisplay();
    }

    /**
     * 表示の更新
     */
    updateDisplay() {
        this.leftCandidate.textContent = this.leftThird.toFixed(this.config.UI.DECIMAL_PLACES);
        this.rightCandidate.textContent = this.rightThird.toFixed(this.config.UI.DECIMAL_PLACES);
        
        // アルゴリズムに応じて範囲表示を変更
        this.updateRangeDisplay();
    }

    /**
     * 範囲表示の更新（アルゴリズムに応じて）
     */
    updateRangeDisplay() {
        const rangeDisplay = document.getElementById('rangeDisplay');
        if (!rangeDisplay) return;

        if (this.currentAlgorithm === 'natural') {
            // Natural PSAの場合：dの値を表示
            const label = window.I18N ? window.I18N.t('ui.dValueLabel') : 'Base: ';
            const currentDValue = this.currentD ? this.currentD.toFixed(this.config.UI.DECIMAL_PLACES) : '0.000';
            rangeDisplay.innerHTML = `<span>${label}:</span> <span>${currentDValue}</span>`;
        } else {
            // 三分探索の場合：調整範囲を表示
            const label = window.I18N ? window.I18N.t('ui.rangeLabel') : '調整範囲';
            const lowerValue = this.lowerBound ? this.lowerBound.toFixed(this.config.UI.DECIMAL_PLACES) : '0';
            const upperValue = this.upperBound ? this.upperBound.toFixed(this.config.UI.DECIMAL_PLACES) : '0';
            rangeDisplay.innerHTML = `<span>${label}:</span> <span id="lowerBound">${lowerValue}</span> ～ <span id="upperBound">${upperValue}</span>`;
        }
    }

    /**
     * 調整フェーズの表示
     */
    showAdjustmentPhase() {
        this.setupPhase.classList.add('hidden');
        this.adjustmentPhase.classList.remove('hidden');
        this.backPhase.classList.remove('hidden');
        this.finishPhase.classList.add('hidden');
    }

    /**
     * 完了フェーズの表示
     */
    showFinishPhase() {
        this.setupPhase.classList.add('hidden');
        this.adjustmentPhase.classList.add('hidden');
        this.backPhase.classList.add('hidden');
        this.finishPhase.classList.remove('hidden');
        
        // 最終感度の表示（事前に設定された値を使用）
        const finalValue = this.finalSensitivity || (this.lowerBound + this.upperBound) / 2;
        if (this.finalSensitivity && document.getElementById('finalSensitivity')) {
            document.getElementById('finalSensitivity').textContent = finalValue.toFixed(this.config.UI.DECIMAL_PLACES);
        }
        
        const message = window.I18N ? 
            window.I18N.t('notifications.adjustmentCompletedWithValue', { 
                value: finalValue.toFixed(this.config.UI.DECIMAL_PLACES) 
            }) : 
            `最適な感度が見つかりました: ${finalValue.toFixed(this.config.UI.DECIMAL_PLACES)}`;
        this.showSuccess(message);
    }

    /**
     * アプリケーションのリセット
     */
    async reset() {
        this.setupPhase.classList.remove('hidden');
        this.adjustmentPhase.classList.add('hidden');
        this.backPhase.classList.add('hidden');
        this.finishPhase.classList.add('hidden');
        
        this.dpiInput.value = '';
        this.dpiButtons.forEach(btn => btn.classList.remove('active'));
        
        this.inputDPI = 0;
        this.lowerBound = 0;
        this.upperBound = 0;
        this.leftThird = 0;
        this.rightThird = 0;
        
        // アルゴリズムロックを解除
        this.algorithmLocked = false;
        
        // メインプロセスのロックも解除
        if (window.electronAPI && window.electronAPI.unlockAlgorithmSelection) {
            try {
                await window.electronAPI.unlockAlgorithmSelection();
                
                // アンロック通知を表示
                const message = window.I18N ? 
                    window.I18N.t('notifications.algorithmUnlocked') : 
                    'アルゴリズム選択のロックが解除されました';
                this.showNotification(message, 'info');
            } catch (error) {
                // メニューロック解除の通知に失敗しました
            }
        }
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    new MouseSensitivityUtility();
});
