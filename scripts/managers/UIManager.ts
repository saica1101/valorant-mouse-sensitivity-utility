/**
 * UI Manager - TypeScript版
 * UI状態管理クラス
 */

// 型定義
type UIPhase = 'setup' | 'adjustment' | 'complete';

interface PhaseDefinition {
    name: UIPhase;
    elements: string[];
    hideElements: string[];
}

interface PhaseTransitionOptions {
    algorithm?: string;
    candidates?: {
        candidateA: number;
        candidateB: number;
    };
    range?: {
        min?: number;
        max?: number;
        currentD?: number;
    };
    result?: number;
}

interface UIState {
    currentPhase: UIPhase;
    theme: string | null;
    elementCount: number;
}

interface AnimationOptions {
    duration?: number;
    easing?: string;
}

interface CandidateDisplay {
    candidateA: number;
    candidateB: number;
}

interface RangeDisplay {
    min?: number;
    max?: number;
    currentD?: number;
}

interface IServiceContainer {
    register<T>(name: string, factory: any, singleton?: boolean): IServiceContainer;
    get<T>(name: string): T;
    has(name: string): boolean;
    resolve(dependencies: Record<string, string>): Record<string, any>;
    initializeAll(serviceNames: string[]): Promise<void>;
    getRegisteredServices(): string[];
}

interface UIAppConfig {
    UI?: {
        ANIMATION_DURATION?: number;
        DECIMAL_PLACES?: number;
    };
    THEME?: {
        STORAGE_KEY?: string;
        DEFAULT?: string;
    };
}

interface AlgorithmManager {
    unlock(): void;
}

interface I18NManager {
    t(key: string): string;
}

// グローバル型拡張は types/index.ts で既に定義されているため削除

class UIManager extends BaseManager {
    private _algorithmManager: AlgorithmManager | null = null;
    private currentPhase: UIPhase = 'setup';
    private elements = new Map<string, HTMLElement>();
    private phases = new Map<UIPhase, PhaseDefinition>();
    private animations = new Map<string, Animation>();
    private animationDuration: number = 300;
    private eventAbortController: AbortController | null = null;

    constructor(config: any = {}, container: IServiceContainer | null = null) {
        super(config, container);
        this.setupPhaseDefinitions();
    }

    /**
     * 初期化処理
     */
    protected async doInit(): Promise<void> {
        this.initializeElements();
        this.setupPhaseTransitions();
        this.setupUIEventHandlers();
        this.initializeTheme();
        this.log('UIManager initialized successfully', 'info');
    }

    /**
     * AlgorithmManagerへのアクセス
     */
    private get algorithmManager(): AlgorithmManager {
        if (!this._algorithmManager) {
            this._algorithmManager = this.getDependency<AlgorithmManager>('AlgorithmManager');
        }
        return this._algorithmManager;
    }

    /**
     * フェーズ定義のセットアップ
     */
    private setupPhaseDefinitions(): void {
        this.phases.set('setup', {
            name: 'setup',
            elements: ['setupPhase'],
            hideElements: ['adjustmentPhase', 'finishPhase', 'backPhase']
        });

        this.phases.set('adjustment', {
            name: 'adjustment',
            elements: ['adjustmentPhase', 'backPhase'],
            hideElements: ['setupPhase', 'finishPhase']
        });

        this.phases.set('complete', {
            name: 'complete',
            elements: ['finishPhase'],
            hideElements: ['setupPhase', 'adjustmentPhase', 'backPhase']
        });
    }

    /**
     * UI要素の初期化
     */
    private initializeElements(): void {
        const elementIds: string[] = [
            'setupPhase', 'dpiInput', 'startBtn', 'algorithmInfo',
            'adjustmentPhase', 'finishPhase', 'backPhase', 'backBtn',
            'currentAlgorithm', 'adjustment-title', 'rangeDisplay',
            'candidatesContainer', 'candidateA', 'candidateB',
            'leftBtn', 'rightBtn', 'equalBtn',
            'finalSensitivity', 'copyButton', 'resetBtn',
            'version', 'themeToggle', 'lowerBound', 'upperBound'
        ];

        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.elements.set(id, element);
            } else {
                this.log(`Element not found: ${id}`, 'warn');
            }
        });

        // DPIプリセットボタンを動的に取得
        const presetButtons = document.querySelectorAll('.dpi-preset');
        presetButtons.forEach((button, index) => {
            this.elements.set(`dpiPreset${index}`, button as HTMLElement);
        });
    }

    /**
     * フェーズ遷移の設定
     */
    private setupPhaseTransitions(): void {
        this.animationDuration = this.getConfig<number>('UI.ANIMATION_DURATION', 300);
    }

    /**
     * UIイベントハンドラーの設定
     */
    private setupUIEventHandlers(): void {
        // 既存のコントローラーがある場合は中止
        if (this.eventAbortController) {
            this.eventAbortController.abort();
        }
        this.eventAbortController = new AbortController();
        const signal = this.eventAbortController.signal;

        // テーマトグルボタン
        const themeToggle = this.getElement('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            }, { signal });
        }

        // 戻るボタン
        const backBtn = this.getElement('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                // DPI入力値をクリア
                const dpiInput = this.getElement('dpiInput') as HTMLInputElement;
                if (dpiInput) {
                    dpiInput.value = '';
                }
                
                // DPIプリセットボタンの選択状態をクリア
                const dpiButtons = document.querySelectorAll('.dpi-preset');
                dpiButtons.forEach(btn => btn.classList.remove('active'));
                
                // setupフェーズに遷移
                this.transitionToPhase('setup');
            }, { signal });
        }

        // ウィンドウリサイズ対応
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250), { signal });
    }

    /**
     * テーマの初期化
     */
    private initializeTheme(): void {
        const savedTheme = localStorage.getItem(this.getConfig<string>('THEME.STORAGE_KEY', 'theme'));
        const defaultTheme = this.getConfig<string>('THEME.DEFAULT', 'light');
        const theme = savedTheme || defaultTheme;
        
        this.setTheme(theme);
    }

    /**
     * 要素を取得
     */
    public getElement(key: string): HTMLElement | null {
        // キャッシュされた要素を最初に試す
        let element = this.elements.get(key);
        
        // キャッシュにない場合は直接DOM検索
        if (!element) {
            const foundElement = document.getElementById(key);
            if (foundElement) {
                element = foundElement;
                // 見つかった要素をキャッシュに追加
                this.elements.set(key, element);
                this.log(`Element dynamically found and cached: ${key}`, 'debug');
            } else {
                this.log(`Element not found: ${key}`, 'warn');
            }
        }
        
        return element || null;
    }

    /**
     * フェーズを遷移
     */
    public async transitionToPhase(phaseName: UIPhase, options: PhaseTransitionOptions = {}): Promise<boolean> {
        if (!this.phases.has(phaseName)) {
            this.log(`Unknown phase: ${phaseName}`, 'error');
            return false;
        }

        const phase = this.phases.get(phaseName)!;
        const previousPhase = this.currentPhase;

        try {
            // フェーズ遷移前の処理
            await this.beforePhaseTransition(previousPhase, phaseName, options);

            // 要素の表示/非表示
            await this.updatePhaseElements(phase);

            // 現在のフェーズを更新
            this.currentPhase = phaseName;

            // フェーズ遷移後の処理
            await this.afterPhaseTransition(previousPhase, phaseName, options);

            this.log(`Successfully transitioned to ${phaseName}`, 'info');
            return true;

        } catch (error) {
            this.handleError(error instanceof Error ? error : new Error(String(error)), 'transitionToPhase');
            return false;
        }
    }

    /**
     * フェーズ要素の更新
     */
    private async updatePhaseElements(phase: PhaseDefinition): Promise<void> {
        const { elements, hideElements } = phase;

        // 非表示にする要素
        if (hideElements) {
            const hidePromises = hideElements.map(elementId => 
                this.hideElement(elementId)
            );
            await Promise.all(hidePromises);
        }

        // 表示する要素
        if (elements) {
            const showPromises = elements.map(elementId => 
                this.showElement(elementId)
            );
            await Promise.all(showPromises);
        }
    }

    /**
     * 要素を表示
     */
    private async showElement(elementId: string): Promise<void> {
        const element = this.getElement(elementId) || document.getElementById(elementId);
        if (!element) return;

        element.classList.remove('hidden');
        element.style.display = '';

        // アニメーション
        if (this.animationDuration > 0) {
            element.style.opacity = '0';
            element.style.transform = 'translateY(10px)';
            
            await new Promise<void>(resolve => {
                requestAnimationFrame(() => {
                    element.style.transition = `opacity ${this.animationDuration}ms ease, transform ${this.animationDuration}ms ease`;
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                    
                    setTimeout(resolve, this.animationDuration);
                });
            });
        }
    }

    /**
     * 要素を非表示
     */
    private async hideElement(elementId: string): Promise<void> {
        const element = this.getElement(elementId) || document.getElementById(elementId);
        if (!element) return;

        // アニメーション
        if (this.animationDuration > 0) {
            element.style.transition = `opacity ${this.animationDuration}ms ease, transform ${this.animationDuration}ms ease`;
            element.style.opacity = '0';
            element.style.transform = 'translateY(-10px)';
            
            await new Promise<void>(resolve => {
                setTimeout(() => {
                    element.classList.add('hidden');
                    element.style.display = 'none';
                    resolve();
                }, this.animationDuration);
            });
        } else {
            element.classList.add('hidden');
            element.style.display = 'none';
        }
    }

    /**
     * フェーズ遷移前の処理
     */
    private async beforePhaseTransition(from: UIPhase, to: UIPhase, options: PhaseTransitionOptions): Promise<void> {
        // アルゴリズムロック解除（setup フェーズに戻る場合）
        if (to === 'setup') {
            try {
                this.algorithmManager.unlock();
            } catch (error) {
                this.log('Failed to unlock algorithm:', 'warn', error);
            }
        }

        // 特定のフェーズ固有の前処理
        switch (to) {
            case 'adjustment':
                await this.prepareAdjustmentPhase(options);
                break;
            case 'complete':
                await this.prepareCompletePhase(options);
                break;
        }
    }

    /**
     * フェーズ遷移後の処理
     */
    private async afterPhaseTransition(from: UIPhase, to: UIPhase, options: PhaseTransitionOptions): Promise<void> {
        // 調整フェーズの準備
        if (to === 'adjustment' && options) {
            await this.prepareAdjustmentPhase(options);
        }

        // フォーカス管理
        this.manageFocus(to);

        // アナウンス（アクセシビリティ）
        if (window.AccessibilityManager && typeof window.AccessibilityManager.announce === 'function') {
            const message = this.getPhaseAnnouncementMessage(to);
            window.AccessibilityManager.announce(message);
        }
    }

    /**
     * 調整フェーズの準備
     */
    private async prepareAdjustmentPhase(options: PhaseTransitionOptions): Promise<void> {
        const { algorithm, candidates, range } = options;

        // タイトルの更新
        const titleElement = this.getElement('adjustment-title');
        if (titleElement) {
            const titleKey = algorithm === 'natural' ? 'ui.adjustmentTitleNatural' : 'ui.adjustmentTitle';
            titleElement.textContent = window.I18N?.t(titleKey) || '感度調整';
        }

        // 候補の更新
        if (candidates) {
            await this.updateCandidateDisplay(candidates);
        }

        // 範囲表示の更新
        if (range) {
            this.log('Updating range display with:', 'debug', range);
            this.updateRangeDisplay(range);
        } else {
            this.log('No range data provided to prepareAdjustmentPhase', 'warn');
        }

        // 等しいボタンのテキスト更新（両方のアルゴリズムに対応）
        const equalOption = this.getElement('equalBtn');
        if (equalOption) {
            const textKey = algorithm === 'natural' ? 'ui.equalOptionNatural' : 'ui.equalOption';
            equalOption.textContent = window.I18N?.t(textKey) || (algorithm === 'natural' ? '✅ 完了' : '⚖️ どちらも同じ');
        }
    }

    /**
     * 完了フェーズの準備
     */
    private async prepareCompletePhase(options: PhaseTransitionOptions): Promise<void> {
        this.log('prepareCompletePhase called with options:', 'debug', options);
        
        const { result } = options;

        // 最終感度の表示
        const finalSensitivityElement = this.getElement('finalSensitivity') || document.getElementById('finalSensitivity');
        if (finalSensitivityElement && result !== undefined && result !== null) {
            const decimalPlaces = this.getConfig<number>('UI.DECIMAL_PLACES', 3);
            // resultが数値であることを確認
            if (typeof result === 'number' && !isNaN(result)) {
                finalSensitivityElement.textContent = result.toFixed(decimalPlaces);
                this.log(`Final sensitivity displayed: ${result.toFixed(decimalPlaces)}`, 'info');
            } else {
                this.log(`Invalid result value: ${result} (type: ${typeof result})`, 'error');
                finalSensitivityElement.textContent = '0.000';
            }
        } else {
            this.log(`prepareCompletePhase: Missing element or result. Element: ${!!finalSensitivityElement}, Result: ${result}`, 'error');
        }
    }

    /**
     * 候補表示の更新
     */
    private async updateCandidateDisplay(candidates: CandidateDisplay): Promise<void> {
        if (!candidates) return;

        const { candidateA, candidateB } = candidates;
        const decimalPlaces = this.getConfig<number>('UI.DECIMAL_PLACES', 3);

        const candidateAElement = this.getElement('candidateA');
        const candidateBElement = this.getElement('candidateB');

        if (candidateAElement && typeof candidateA === 'number') {
            candidateAElement.textContent = candidateA.toFixed(decimalPlaces);
        }
        
        if (candidateBElement && typeof candidateB === 'number') {
            candidateBElement.textContent = candidateB.toFixed(decimalPlaces);
        }
    }

    /**
     * 範囲表示の更新
     */
    public updateRangeDisplay(range: RangeDisplay): void {
        const lowerBoundElement = this.getElement('lowerBound');
        const upperBoundElement = this.getElement('upperBound');
        const rangeDisplayElement = this.getElement('rangeDisplay');
        
        if (range) {
            const decimalPlaces = this.getConfig<number>('UI.DECIMAL_PLACES', 3);
            
            // Natural PSAの場合：currentD値のみを表示
            if (range.currentD !== undefined) {
                if (rangeDisplayElement) {
                    const label = window.I18N?.t('ui.dValueLabel') || 'Base';
                    const currentDValue = range.currentD.toFixed(decimalPlaces);
                    rangeDisplayElement.innerHTML = `<span>${label}:</span> <span>${currentDValue}</span>`;
                }
            }
            // 三分探索の場合：min-max範囲を表示
            else if (range.min !== undefined && range.max !== undefined) {
                if (lowerBoundElement && upperBoundElement) {
                    lowerBoundElement.textContent = range.min.toFixed(decimalPlaces);
                    upperBoundElement.textContent = range.max.toFixed(decimalPlaces);
                }
            }
        }
    }

    /**
     * テーマを設定
     */
    public setTheme(theme: string): void {
        // HTML要素にdata-theme属性を設定
        document.documentElement.setAttribute('data-theme', theme);
        
        // bodyクラスも設定（互換性のため）
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
        
        const themeToggle = this.getElement('themeToggle');
        if (themeToggle) {
            const isDark = theme === 'dark';
            themeToggle.innerHTML = `${isDark ? '☀️' : '🌙'} <span data-i18n="${isDark ? 'ui.lightMode' : 'ui.darkMode'}">${isDark ? (window.I18N?.t('ui.lightMode') || 'ライトモード') : (window.I18N?.t('ui.darkMode') || 'ダークモード')}</span>`;
            themeToggle.setAttribute('aria-label', 
                isDark ? 
                (window.I18N?.t('ui.lightMode') || 'ライトモード') : 
                (window.I18N?.t('ui.darkMode') || 'ダークモード')
            );
        }

        localStorage.setItem(this.getConfig<string>('THEME.STORAGE_KEY', 'theme'), theme);
    }

    /**
     * テーマを切り替え
     */
    public toggleTheme(): void {
        const currentTheme = localStorage.getItem(this.getConfig<string>('THEME.STORAGE_KEY', 'theme')) || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * フォーカス管理
     */
    private manageFocus(phase: UIPhase): void {
        let focusTarget: HTMLElement | null = null;

        switch (phase) {
            case 'setup':
                focusTarget = this.getElement('dpiInput');
                break;
            case 'adjustment':
                focusTarget = this.getElement('leftBtn');
                break;
            case 'complete':
                focusTarget = this.getElement('copyButton');
                break;
        }

        if (focusTarget) {
            setTimeout(() => focusTarget!.focus(), this.animationDuration + 50);
        }
    }

    /**
     * フェーズアナウンスメッセージを取得
     */
    private getPhaseAnnouncementMessage(phase: UIPhase): string {
        switch (phase) {
            case 'setup':
                return window.I18N?.t('ui.step1') || 'Step 1: マウスDPIを入力または選択';
            case 'adjustment':
                return window.I18N?.t('ui.adjustmentTitle') || '感度調整';
            case 'complete':
                return window.I18N?.t('ui.completeTitle') || '最適な感度が見つかりました！';
            default:
                return '';
        }
    }

    /**
     * ウィンドウリサイズ処理
     */
    private handleResize(): void {
        // レスポンシブ対応やレイアウト調整
        this.log('Window resize handled', 'debug');
    }

    /**
     * 現在のフェーズを取得
     */
    public getCurrentPhase(): UIPhase {
        return this.currentPhase;
    }

    /**
     * UIの状態を取得
     */
    public getState(): UIState {
        return {
            currentPhase: this.currentPhase,
            theme: localStorage.getItem(this.getConfig<string>('THEME.STORAGE_KEY', 'theme')),
            elementCount: this.elements.size
        };
    }

    /**
     * クリーンアップ処理
     */
    public destroy(): void {
        // イベントリスナーのクリーンアップ
        if (this.eventAbortController) {
            this.eventAbortController.abort();
            this.eventAbortController = null;
        }

        // アニメーションのクリーンアップ
        for (const animation of this.animations.values()) {
            animation.cancel();
        }
        this.animations.clear();

        // マップのクリア
        this.elements.clear();
        this.phases.clear();

        super.destroy();
        this.log('UIManager destroyed', 'info');
    }
}

// Export for both ES6 modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager };
} else if (typeof window !== 'undefined') {
    (window as any).UIManager = UIManager;
}

export default UIManager;
