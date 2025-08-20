/**
 * Valorant Mouse Sensitivity Utility - TypeScript版
 * マウス感度調整アプリケーション - リファクタリング版メインアプリケーション
 */

// 型定義
type PhaseType = 'setup' | 'adjustment' | 'complete';
type AlgorithmType = 'ternary' | 'natural';
type ChoiceType = 'left' | 'right' | 'equal';

interface AppElements {
    dpiInput: HTMLInputElement | null;
    startButton: HTMLButtonElement | null;
    leftOption: HTMLButtonElement | null;
    rightOption: HTMLButtonElement | null;
    equalOption: HTMLButtonElement | null;
    copyButton: HTMLButtonElement | null;
    restartButton: HTMLButtonElement | null;
    version: HTMLElement | null;
}

interface ManagerInstances {
    notification: any;
    validation: any;
    ui: any;
    algorithm: any;
    accessibility: any;
}

interface AppState {
    isInitialized: boolean;
    currentPhase: PhaseType;
    managers: string[];
    managerStats: Record<string, any>;
}

interface TernaryResult {
    converged?: boolean;
    result?: number;
    leftThird?: number;
    rightThird?: number;
    range?: {
        min: number;
        max: number;
    };
}

interface NaturalResult {
    completed: boolean;
    result?: number;
    candidates?: {
        candidateA: number;
        candidateB: number;
    };
    range?: {
        currentD: number;
    };
}

interface ValidationResult {
    isValid: boolean;
    errors?: string[];
}

interface ServiceContainer {
    register<T>(name: string, factory: any, singleton?: boolean): ServiceContainer;
    get<T>(name: string): T;
    has(name: string): boolean;
    resolve(dependencies: Record<string, string>): Record<string, any>;
    initializeAll(serviceNames: string[]): Promise<void>;
    getRegisteredServices(): string[];
}

interface ElectronAPI {
    getVersion?(): Promise<string>;
    getLanguage?(): Promise<string>;
    onLanguageChanged?(callback: (event: any, language: string) => void): void;
}

interface I18NManager {
    init?(): Promise<void>;
    setLanguage?(language: string): void;
    loadSavedLanguage?(): void;
    t?(key: string, params?: Record<string, any>): string;
}

interface MainAppConfig {
    APP?: {
        FALLBACK_VERSION?: string;
    };
}

/**
 * Valorant Mouse Sensitivity Utility Application
 * メインアプリケーションクラス
 */

class MouseSensitivityUtility {
    private managers = new Map<string, any>();
    private container: ServiceContainer | null = null;
    private isInitialized: boolean = false;
    private currentPhase: PhaseType = 'setup';
    private currentLanguage: string | null = null;
    private eventHandlersSetup: boolean = false;
    private elements: AppElements = {} as AppElements;
    private dpiPresetButtons: NodeListOf<Element> = {} as NodeListOf<Element>;

    constructor() {
        this.bindMethods();
        
        this.init().catch(error => {
            console.error('[ERROR] Init failed:', error);
            this.handleFatalError('初期化エラー', `アプリケーションの初期化中にエラーが発生しました: ${error.message}`);
        });
    }

    /**
     * メソッドのバインド
     */
    private bindMethods(): void {
        this.handleDPIInput = this.handleDPIInput.bind(this);
        this.handlePresetSelection = this.handlePresetSelection.bind(this);
        this.handleStartAdjustment = this.handleStartAdjustment.bind(this);
        this.handleChoiceSelection = this.handleChoiceSelection.bind(this);
        this.handleCopyToClipboard = this.handleCopyToClipboard.bind(this);
        this.handleRestart = this.handleRestart.bind(this);
    }

    /**
     * アプリケーションの初期化
     */
    private async init(): Promise<void> {
        // 重複初期化を防ぐ
        if (this.isInitialized) {
            this.log('Application already initialized', 'warn');
            return;
        }
        
        this.log('Starting application initialization...', 'info');
        
        try {
            // 設定の確認
            if (!window.CONFIG) {
                throw new Error('Configuration not loaded');
            }

            // ServiceContainerの初期化
            this.initializeServiceContainer();

            // マネージャーの初期化
            await this.initializeManagers();

            // DOM要素の設定
            this.setupElements();

            // イベントハンドラーの設定
            this.setupEventHandlers();

            // 初期状態の設定
            await this.setupInitialState();

            this.isInitialized = true;
            this.log('Application initialized successfully', 'info');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.handleFatalError('初期化エラー', errorMessage);
            throw error;
        }
    }

    /**
     * ServiceContainerの初期化
     */
    private initializeServiceContainer(): void {
        const ServiceContainerClass = (window as any).ServiceContainer;
        if (!ServiceContainerClass) {
            throw new Error('ServiceContainer class not found. Make sure ServiceContainer.js is loaded.');
        }
        
        this.container = new ServiceContainerClass();
        
        // マネージャーをサービスとして登録
        const NotificationManagerClass = (window as any).NotificationManager;
        const ValidationManagerClass = (window as any).ValidationManager;
        const UIManagerClass = (window as any).UIManager;
        const AlgorithmManagerClass = (window as any).AlgorithmManager;
        const AccessibilityManagerClass = (window as any).AccessibilityManager;

        // 各クラスの可用性をチェック
        if (!NotificationManagerClass) {
            throw new Error('NotificationManager class not found. Make sure NotificationManager.js is loaded.');
        }
        if (!ValidationManagerClass) {
            throw new Error('ValidationManager class not found. Make sure ValidationManager.js is loaded.');
        }
        if (!UIManagerClass) {
            throw new Error('UIManager class not found. Make sure UIManager.js is loaded.');
        }
        if (!AlgorithmManagerClass) {
            throw new Error('AlgorithmManager class not found. Make sure AlgorithmManager.js is loaded.');
        }
        // AccessibilityManagerは任意とする
        if (!AccessibilityManagerClass) {
            this.log('AccessibilityManager class not found. Accessibility features will be disabled.', 'warn');
        }

        if (!this.container) {
            throw new Error('ServiceContainer initialization failed');
        }

        this.container
            .register('NotificationManager', (container: ServiceContainer) => new NotificationManagerClass({}, container))
            .register('ValidationManager', (container: ServiceContainer) => new ValidationManagerClass({}, container))
            .register('UIManager', (container: ServiceContainer) => new UIManagerClass({}, container))
            .register('AlgorithmManager', (container: ServiceContainer) => new AlgorithmManagerClass({}, container));
            
        // AccessibilityManagerが利用可能な場合のみ登録
        if (AccessibilityManagerClass) {
            this.container.register('AccessibilityManager', (container: ServiceContainer) => new AccessibilityManagerClass({}, container));
        }
            
        this.log('ServiceContainer initialized', 'info');
    }

    /**
     * マネージャーの初期化
     */
    private async initializeManagers(): Promise<void> {
        const managerNames: string[] = [
            'NotificationManager',
            'ValidationManager', 
            'UIManager',
            'AlgorithmManager'
        ];
        
        // AccessibilityManagerが利用可能な場合のみ追加
        if ((window as any).AccessibilityManager) {
            managerNames.push('AccessibilityManager');
        }

        // DIコンテナ経由でマネージャーを取得・初期化
        for (const managerName of managerNames) {
            try {
                const shortName = managerName.replace('Manager', '').toLowerCase();
                
                // 重複初期化を防ぐ
                if (this.managers.has(shortName)) {
                    this.log(`${shortName} manager already exists, skipping`, 'warn');
                    continue;
                }
                
                const manager = this.container!.get(managerName) as any;
                if (manager && typeof manager.init === 'function') {
                    await manager.init();
                }
                this.managers.set(shortName, manager);
                this.log(`${shortName} manager initialized`, 'debug');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.log(`Failed to initialize ${managerName}: ${errorMessage}`, 'error');
                throw error;
            }
        }

        // グローバルアクセス用の設定（レガシー互換性維持）
        window.NotificationManager = this.managers.get('notification');
        window.ValidationManager = this.managers.get('validation');
        window.UIManager = this.managers.get('ui');
        window.AlgorithmManager = this.managers.get('algorithm');
        
        // AccessibilityManagerが利用可能な場合のみ設定
        if (this.managers.has('accessibility')) {
            window.AccessibilityManager = this.managers.get('accessibility');
        }
        
        // ServiceContainerもグローバルアクセス可能にする（移行期間中）
        (window as any).serviceContainer = this.container!;
        
        this.log('All managers initialized and global references set', 'info');
    }

    /**
     * DOM要素の設定
     */
    private setupElements(): void {
        this.elements = {
            dpiInput: document.getElementById('dpiInput') as HTMLInputElement,
            startButton: document.getElementById('startBtn') as HTMLButtonElement,
            leftOption: document.getElementById('leftBtn') as HTMLButtonElement,
            rightOption: document.getElementById('rightBtn') as HTMLButtonElement,
            equalOption: document.getElementById('equalBtn') as HTMLButtonElement,
            copyButton: document.getElementById('copyButton') as HTMLButtonElement,
            restartButton: document.getElementById('resetBtn') as HTMLButtonElement,
            version: document.getElementById('version')
        };

        // DPIプリセットボタンを取得
        this.dpiPresetButtons = document.querySelectorAll('.dpi-preset');
    }

    /**
     * イベントハンドラーの設定
     */
    private setupEventHandlers(): void {
        // 重複を防ぐ
        if (this.eventHandlersSetup) {
            this.log('Event handlers already setup, skipping', 'warn');
            return;
        }

        // DPI入力
        if (this.elements.dpiInput) {
            this.elements.dpiInput.addEventListener('input', this.handleDPIInput);
            this.elements.dpiInput.addEventListener('keypress', (event: KeyboardEvent) => {
                if (event.key === 'Enter') {
                    this.handleStartAdjustment();
                }
            });
        }

        // DPIプリセットボタン
        this.dpiPresetButtons.forEach(button => {
            button.addEventListener('click', this.handlePresetSelection as EventListener);
        });

        // 開始ボタン
        if (this.elements.startButton) {
            this.elements.startButton.addEventListener('click', this.handleStartAdjustment);
        }

        // 選択ボタン
        if (this.elements.leftOption) {
            this.elements.leftOption.addEventListener('click', () => this.handleChoiceSelection('left'));
        }
        if (this.elements.rightOption) {
            this.elements.rightOption.addEventListener('click', () => this.handleChoiceSelection('right'));
        }
        if (this.elements.equalOption) {
            this.elements.equalOption.addEventListener('click', () => this.handleChoiceSelection('equal'));
        }

        // 完了フェーズのボタン
        if (this.elements.copyButton) {
            this.elements.copyButton.addEventListener('click', this.handleCopyToClipboard);
        }
        if (this.elements.restartButton) {
            this.elements.restartButton.addEventListener('click', this.handleRestart);
        }

        // メニューからの言語変更
        if (window.electronAPI && window.electronAPI.onLanguageChanged) {
            window.electronAPI.onLanguageChanged(async (event: any, language: string) => {
                await this.handleLanguageChange(language);
            });
        }

        this.eventHandlersSetup = true;
    }

    /**
     * 初期状態の設定
     */
    private async setupInitialState(): Promise<void> {
        // バージョン情報の読み込み
        await this.loadAppVersion();

        // I18Nの初期化
        if (window.I18N && typeof window.I18N.init === 'function') {
            await window.I18N.init();
        }

        // 言語設定の読み込み
        await this.loadLanguageFromMain();

        // テーマボタンのテキストを強制設定
        this.fixThemeButtonText();

        // フォーカス設定
        if (this.elements.dpiInput) {
            this.elements.dpiInput.focus();
        }
    }

    /**
     * テーマボタンのテキストを修正
     */
    private fixThemeButtonText(): void {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const textSpan = themeToggle.querySelector('span[data-i18n="ui.darkMode"]');
            if (textSpan && (!textSpan.textContent || textSpan.textContent.trim() === '')) {
                textSpan.textContent = window.I18N?.t?.('ui.darkMode') || 'ダークモード';
            }
        }
    }

    /**
     * DPI入力処理
     */
    private handleDPIInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        const value = target.value;
        
        // 開始ボタンの有効/無効（入力値の存在のみをチェック）
        const hasValue = value && value.trim() !== '';
        if (this.elements.startButton) {
            this.elements.startButton.disabled = !hasValue;
        }
    }

    /**
     * プリセット選択処理
     */
    private handlePresetSelection(event: Event): void {
        const target = event.target as HTMLElement;
        const dpi = target.getAttribute('data-dpi');
        if (this.elements.dpiInput && dpi) {
            this.elements.dpiInput.value = dpi;
            
            // バリデーション実行
            const validation = this.managers.get('validation');
            if (validation && typeof validation.validateElement === 'function') {
                validation.validateElement(this.elements.dpiInput, false);
            }

            // 開始ボタンを有効化
            if (this.elements.startButton) {
                this.elements.startButton.disabled = false;
            }
        }
    }

    /**
     * 調整開始処理
     */
    private async handleStartAdjustment(): Promise<void> {
        try {
            if (!this.elements.dpiInput) return;
            
            const dpiValue = this.elements.dpiInput.value;
            const validation = this.managers.get('validation');
            
            // 空値の事前チェック
            if (!dpiValue || dpiValue.trim() === '') {
                this.managers.get('notification').error(
                    window.I18N?.t?.('errors.dpiRequired') || 'DPI値の入力が必要です'
                );
                return;
            }
            
            const dpi = parseInt(dpiValue);
            
            // バリデーション（legacy版と同じロジック）
            if (validation) {
                const result: ValidationResult = validation.validateDPI(dpiValue);
                if (!result.isValid) {
                    this.managers.get('notification').error(result.errors?.[0] || 'バリデーションエラー');
                    return;
                }
            }

            const algorithm = this.managers.get('algorithm');
            const ui = this.managers.get('ui');

            // DPI入力後はアルゴリズムをロック（通知あり）
            algorithm.lock(true);

            // アルゴリズムに応じて初期化
            const currentAlgorithm: AlgorithmType = algorithm.getCurrentAlgorithm();
            let candidates: { candidateA: number; candidateB: number };
            let range: { min?: number; max?: number; currentD?: number };

            if (currentAlgorithm === 'ternary') {
                const result: TernaryResult = algorithm.initializeTernarySearch(dpi);
                candidates = {
                    candidateA: result.leftThird!,
                    candidateB: result.rightThird!
                };
                range = result.range!;
            } else {
                const result: NaturalResult = algorithm.initializeNaturalPSA(dpi);
                candidates = result.candidates!;
                range = result.range!;
            }

            // 成功通知
            const message = window.I18N?.t ? 
                window.I18N.t('notifications.adjustmentStartedWithDpi', { dpi: dpi }) : 
                `感度調整を開始します。DPI: ${dpi}`;
            this.managers.get('notification').show(message, 'success');
            
            // 調整フェーズに遷移
            const transitionResult = await ui.transitionToPhase('adjustment', {
                algorithm: currentAlgorithm,
                candidates,
                range
            });
            
            if (transitionResult) {
                this.currentPhase = 'adjustment';
            }

        } catch (error) {
            this.managers.get('notification').showAdjustmentError(error);
        }
    }

    /**
     * 選択処理
     */
    private async handleChoiceSelection(choice: ChoiceType): Promise<void> {
        try {
            const algorithm = this.managers.get('algorithm');
            const ui = this.managers.get('ui');
            const currentAlgorithm: AlgorithmType = algorithm.getCurrentAlgorithm();

            let result: TernaryResult | NaturalResult;

            if (currentAlgorithm === 'ternary') {
                result = algorithm.processTernarySearchChoice(choice) as TernaryResult;
                
                if (result.converged) {
                    // 完了
                    this.log(`Ternary search completed with result: ${result.result}`, 'debug');
                    await ui.transitionToPhase('complete', { result: result.result });
                    this.currentPhase = 'complete';
                } else {
                    // 次の候補を表示
                    await ui.updateCandidateDisplay({
                        candidateA: result.leftThird!,
                        candidateB: result.rightThird!
                    });
                    
                    // 範囲表示を更新
                    if (result.range) {
                        ui.updateRangeDisplay(result.range);
                    }
                }
            } else {
                // Natural PSA
                const candidateAElement = ui.getElement('candidateA');
                const candidateBElement = ui.getElement('candidateB');
                
                const currentCandidates = {
                    candidateA: parseFloat(candidateAElement?.textContent || '0'),
                    candidateB: parseFloat(candidateBElement?.textContent || '0')
                };
                
                result = algorithm.processNaturalPSAChoice(choice, currentCandidates) as NaturalResult;
                
                if (result.completed) {
                    // 完了
                    await ui.transitionToPhase('complete', { result: result.result });
                    this.currentPhase = 'complete';
                } else {
                    // 次の候補を表示
                    await ui.updateCandidateDisplay(result.candidates);
                }
            }

        } catch (error) {
            this.managers.get('notification').showAdjustmentError(error);
        }
    }

    /**
     * クリップボードコピー処理
     */
    private async handleCopyToClipboard(): Promise<void> {
        try {
            const ui = this.managers.get('ui');
            const finalSensitivityElement = ui.getElement('finalSensitivity');
            
            if (!finalSensitivityElement) {
                throw new Error('Final sensitivity element not found');
            }

            const sensitivity = finalSensitivityElement.textContent || '';
            
            // クリップボードにコピー
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(sensitivity);
            } else {
                // フォールバック
                const textArea = document.createElement('textarea');
                textArea.value = sensitivity;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }

            this.managers.get('notification').showCopySuccess();
            this.log(`Sensitivity copied to clipboard: ${sensitivity}`, 'info');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log(`Error copying to clipboard: ${errorMessage}`, 'error');
            this.managers.get('notification').showCopyError();
        }
    }

    /**
     * 再開処理
     */
    private async handleRestart(): Promise<void> {
        try {
            const ui = this.managers.get('ui');
            const algorithm = this.managers.get('algorithm');
            const validation = this.managers.get('validation');

            // 状態をリセット
            algorithm.resetAlgorithmState();
            
            if (validation && typeof validation.clearAllValidation === 'function') {
                validation.clearAllValidation();
            }

            // セットアップフェーズに戻る
            await ui.transitionToPhase('setup');
            this.currentPhase = 'setup';

            // DPI入力をクリア
            if (this.elements.dpiInput) {
                this.elements.dpiInput.value = '';
                this.elements.dpiInput.focus();
            }

            // DPIプリセットボタンの選択状態をクリア
            this.dpiPresetButtons.forEach(btn => btn.classList.remove('active'));

            this.log('Application restarted', 'info');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log(`Error restarting application: ${errorMessage}`, 'error');
            this.managers.get('notification').error('再開中にエラーが発生しました');
        }
    }

    /**
     * アプリバージョンの読み込み
     */
    private async loadAppVersion(): Promise<void> {
        try {
            let version = (window as any).CONFIG?.APP?.FALLBACK_VERSION || 'v1.4.0';
            
            if (window.electronAPI && window.electronAPI.getVersion) {
                version = await window.electronAPI.getVersion();
            }

            if (this.elements.version) {
                this.elements.version.textContent = `Version ${version}`;
            }

            this.log(`App version loaded: ${version}`, 'debug');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log(`Error loading app version: ${errorMessage}`, 'warn');
        }
    }

    /**
     * メインプロセスから言語設定を読み込み
     */
    private async loadLanguageFromMain(): Promise<void> {
        try {
            if (window.electronAPI && window.electronAPI.getLanguage) {
                const language = await window.electronAPI.getLanguage();
                if (window.I18N && language) {
                    window.I18N.setLanguage?.(language);
                    this.currentLanguage = language;
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log(`Error loading language: ${errorMessage}`, 'warn');
            // フォールバック: 保存された言語設定を使用
            if (window.I18N && typeof window.I18N.loadSavedLanguage === 'function') {
                window.I18N.loadSavedLanguage();
            }
        }
    }

    /**
     * 言語変更処理
     */
    private async handleLanguageChange(language: string): Promise<void> {
        try {
            // 現在の言語と同じ場合はスキップ
            if (this.currentLanguage === language) {
                return;
            }
            
            if (window.I18N) {
                window.I18N.setLanguage?.(language);
                this.currentLanguage = language;
                
                // アルゴリズム表示を更新
                const algorithm = this.managers.get('algorithm');
                if (algorithm && typeof algorithm.updateAlgorithmDisplay === 'function') {
                    algorithm.updateAlgorithmDisplay();
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log(`Error changing language: ${errorMessage}`, 'error');
        }
    }

    /**
     * 致命的エラーの処理
     */
    private handleFatalError(title: string, message: string): void {
        if ((window as any).ErrorDisplay) {
            (window as any).ErrorDisplay.showFatalError(title, message);
        } else {
            document.body.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f0f0; font-family: Arial, sans-serif;">
                    <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px;">
                        <h2 style="color: #e74c3c; margin-bottom: 16px;">${title}</h2>
                        <p style="color: #666; margin-bottom: 24px;">${message}</p>
                        <button onclick="location.reload()" style="background: #3498db; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer;">リロード</button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * アプリケーション状態の取得
     */
    public getState(): AppState {
        return {
            isInitialized: this.isInitialized,
            currentPhase: this.currentPhase,
            managers: Array.from(this.managers.keys()),
            managerStats: Array.from(this.managers.entries()).reduce((stats, [name, manager]) => {
                if (typeof manager.getStatistics === 'function') {
                    stats[name] = manager.getStatistics();
                }
                return stats;
            }, {} as Record<string, any>)
        };
    }

    /**
     * ログ出力
     */
    private log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'debug'): void {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [MouseSensitivityUtility]`;
        
        switch (level) {
            case 'error':
                console.error(`${prefix} ERROR: ${message}`);
                break;
            case 'warn':
                console.warn(`${prefix} WARN: ${message}`);
                break;
            case 'info':
                console.info(`${prefix} INFO: ${message}`);
                break;
            default:
                // デバッグログを無効化
                // console.log(`${prefix} DEBUG: ${message}`);
        }
    }

    /**
     * クリーンアップ
     */
    public destroy(): void {
        // マネージャーのクリーンアップ
        this.managers.forEach((manager, name) => {
            if (typeof manager.destroy === 'function') {
                manager.destroy();
                this.log(`${name} manager destroyed`, 'debug');
            }
        });

        this.managers.clear();
        this.isInitialized = false;
        this.log('Application destroyed', 'info');
    }
}

// アプリケーションの初期化（スクリプト読み込み完了後）
document.addEventListener('scriptsLoaded', () => {
    console.log('Scripts loaded event received - initializing application...');
    
    // グローバル重複初期化を防ぐ
    if (!(window as any).app) {
        try {
            console.log('Creating MouseSensitivityUtility instance...');
            (window as any).app = new MouseSensitivityUtility();
            console.log('Application initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            
            // エラー情報を詳細に表示
            if (error instanceof Error) {
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    availableClasses: {
                        ServiceContainer: typeof (window as any).ServiceContainer,
                        BaseManager: typeof (window as any).BaseManager,
                        NotificationManager: typeof (window as any).NotificationManager,
                        ValidationManager: typeof (window as any).ValidationManager,
                        UIManager: typeof (window as any).UIManager,
                        AlgorithmManager: typeof (window as any).AlgorithmManager,
                        AccessibilityManager: typeof (window as any).AccessibilityManager
                    }
                });
            }
            
            // ユーザーに分かりやすいエラーメッセージを表示
            const errorElement = document.createElement('div');
            errorElement.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #f8d7da;
                color: #721c24;
                padding: 20px;
                border: 1px solid #f5c6cb;
                border-radius: 5px;
                z-index: 9999;
                max-width: 500px;
                text-align: center;
            `;
            errorElement.innerHTML = `
                <h3>初期化エラー</h3>
                <p>アプリケーションの初期化中にエラーが発生しました。</p>
                <details>
                    <summary>詳細情報</summary>
                    <pre style="text-align: left; white-space: pre-wrap;">${error.message}</pre>
                </details>
                <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 15px;">再読み込み</button>
            `;
            document.body.appendChild(errorElement);
        }
    }
});

// フォールバック: 通常のDOMContentLoadedでも試行（動的読み込みが失敗した場合）
document.addEventListener('DOMContentLoaded', () => {
    // 動的読み込みが使用できない場合のフォールバック
    setTimeout(() => {
        if (!(window as any).app && typeof (window as any).MouseSensitivityUtility !== 'undefined') {
            console.log('Fallback initialization...');
            try {
                (window as any).app = new MouseSensitivityUtility();
                console.log('Fallback initialization successful!');
            } catch (error) {
                console.error('Fallback initialization failed:', error);
            }
        }
    }, 1000);
});

// グローバルに公開
(window as any).MouseSensitivityUtility = MouseSensitivityUtility;
