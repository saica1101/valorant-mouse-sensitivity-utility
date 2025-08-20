/**
 * Algorithm Manager - TypeScript版
 * アルゴリズム管理クラス
 */

// 型定義
type AlgorithmType = 'ternary' | 'natural';
type TernaryChoice = 'left' | 'right' | 'equal';

interface AlgorithmSettings {
    minSensi: number;
    maxSensi: number;
    rangeMultiplier: number;
    convergenceThreshold: number;
    baseSensi: number;
    naturalBaseSensi: number;
}

interface TernarySearchResult {
    converged?: boolean;
    result?: number;
    leftThird?: number;
    rightThird?: number;
    range?: {
        min: number;
        max: number;
    };
}

interface TernaryInitResult {
    leftThird: number;
    rightThird: number;
    range: {
        min: number;
        max: number;
    };
}

interface NaturalPSAState {
    baseValue: number;
    iterations: number;
    history: NaturalHistoryEntry[];
    currentD?: number;
}

interface NaturalHistoryEntry {
    iteration: number;
    choice: TernaryChoice;
    selectedValue: number;
    previousD: number;
    newD: number;
}

interface NaturalMultipliers {
    low: number;
    high: number;
}

interface CandidatesPair {
    candidateA: number;
    candidateB: number;
}

interface NaturalInitResult {
    candidates: CandidatesPair;
    range: {
        currentD: number;
    };
}

interface NaturalStepResult {
    completed: boolean;
    result?: number;
    candidates?: CandidatesPair;
    range?: {
        currentD: number;
    };
}

interface AlgorithmStatistics {
    algorithm: AlgorithmType;
    isLocked: boolean;
    ternarySearch: {
        dpi: number;
        range: [number, number];
        candidates: [number, number];
    };
    naturalPSA: {
        iterations: number;
        history: NaturalHistoryEntry[];
    };
}

interface IServiceContainer {
    register<T>(name: string, factory: any, singleton?: boolean): IServiceContainer;
    get<T>(name: string): T;
    has(name: string): boolean;
    resolve(dependencies: Record<string, string>): Record<string, any>;
    initializeAll(serviceNames: string[]): Promise<void>;
    getRegisteredServices(): string[];
}

interface AppConfig {
    ALGORITHM?: {
        MIN_SENSI?: number;
        MAX_SENSI?: number;
        RANGE_MULTIPLIER?: number;
        CONVERGENCE_THRESHOLD?: number;
    };
    BASE_SENSI?: number;
    [key: string]: any;
}

interface NotificationManager {
    show(message: string, type: string): void;
}

interface ElectronAPI {
    getAlgorithm?(): Promise<string>;
    setAlgorithm?(algorithm: string): Promise<void>;
    lockAlgorithmSelection?(): void;
    unlockAlgorithmSelection?(): void;
    onAlgorithmChanged?(callback: (event: any, algorithm: string) => void): void;
    onLanguageChanged?(callback: () => void): void;
}

interface I18NManager {
    t(key: string): string;
    isReady?: boolean;
}

// グローバル型拡張は types/index.ts で既に定義されている

class AlgorithmManager extends BaseManager {
    private _notificationManager: NotificationManager | null = null;
    
    // アルゴリズム関連の状態
    private currentAlgorithm: AlgorithmType = 'ternary';
    private locked: boolean = false;
    
    // 三分探索アルゴリズムの状態
    private inputDPI: number = 0;
    private lowerBound: number = 0;
    private upperBound: number = 0;
    private leftThird: number = 0;
    private rightThird: number = 0;
    
    // ナチュラルPSAアルゴリズムの状態
    private naturalState: NaturalPSAState = {
        baseValue: 0,
        iterations: 0,
        history: []
    };
    
    // 設定
    private settings: AlgorithmSettings;

    constructor(config: any = {}, container: IServiceContainer | null = null) {
        super(config, container);
        
        this.settings = {
            minSensi: this.getConfig<number>('ALGORITHM.MIN_SENSI', 0.1),
            maxSensi: this.getConfig<number>('ALGORITHM.MAX_SENSI', 5.0),
            rangeMultiplier: this.getConfig<number>('ALGORITHM.RANGE_MULTIPLIER', 8),
            convergenceThreshold: this.getConfig<number>('ALGORITHM.CONVERGENCE_THRESHOLD', 0.001),
            baseSensi: this.getConfig<number>('BASE_SENSI', 80),
            naturalBaseSensi: 280  // Natural PSA用の基準値
        };
        
        this.log('AlgorithmManager settings:', 'debug', this.settings);
    }

    /**
     * 初期化処理
     */
    protected async doInit(): Promise<void> {
        await this.loadAlgorithmFromMain();
        this.setupAlgorithmEventHandlers();
        this.log('AlgorithmManager initialized', 'info');
    }

    /**
     * NotificationManagerへのアクセス
     */
    private get notificationManager(): NotificationManager {
        if (!this._notificationManager) {
            this._notificationManager = this.getDependency<NotificationManager>('NotificationManager');
        }
        return this._notificationManager;
    }

    /**
     * メインプロセスからアルゴリズム設定を読み込み
     */
    private async loadAlgorithmFromMain(): Promise<void> {
        try {            
            const electronAPI = (window as any).electronAPI as ElectronAPI | undefined;
            if (electronAPI && electronAPI.getAlgorithm) {
                const algorithm = await electronAPI.getAlgorithm();
                
                if (algorithm && ['ternary', 'natural'].includes(algorithm)) {
                    this.currentAlgorithm = algorithm as AlgorithmType;
                    // I18Nが初期化されるまで表示更新を遅延
                    this.scheduleDisplayUpdate();
                    this.log(`Algorithm loaded: ${algorithm}`, 'debug');
                } else {
                    this.log(`Invalid algorithm: ${algorithm}, using default`, 'warn');
                }
            } else {
                this.log('electronAPI not available, using default algorithm', 'warn');
            }
        } catch (error) {
            this.handleError(error instanceof Error ? error : new Error(String(error)), 'loadAlgorithmFromMain');
        }
    }

    /**
     * 表示更新をスケジュール（I18Nの初期化を待つ）
     */
    private scheduleDisplayUpdate(): void {
        // I18Nが利用可能になるまで待機
        const checkI18N = (): void => {
            const i18n = (window as any).I18N as I18NManager | undefined;
            if (i18n && i18n.isReady) {
                this.updateAlgorithmDisplay();
            } else {
                setTimeout(checkI18N, 100);
            }
        };
        
        // i18nReadyイベントも監視
        document.addEventListener('i18nReady', () => {
            this.updateAlgorithmDisplay();
        }, { once: true });
        
        checkI18N();
    }

    /**
     * アルゴリズム変更イベントハンドラーの設定
     */
    private setupAlgorithmEventHandlers(): void {
        const electronAPI = (window as any).electronAPI as ElectronAPI | undefined;
        
        // メニューからのアルゴリズム変更を監視
        if (electronAPI && electronAPI.onAlgorithmChanged) {
            electronAPI.onAlgorithmChanged((event: any, algorithm: string) => {
                this.log(`Algorithm changed from menu: ${algorithm}`, 'debug');
                this.setAlgorithm(algorithm as AlgorithmType, false);
            });
        }

        // 言語変更時のアルゴリズム表示更新
        if (electronAPI && electronAPI.onLanguageChanged) {
            electronAPI.onLanguageChanged(() => {
                // 言語が変更されたときにアルゴリズム表示を更新
                setTimeout(() => this.updateAlgorithmDisplay(), 100);
            });
        }
        
        // ブラウザ内での言語変更も監視
        document.addEventListener('i18nLanguageChanged', () => {
            this.updateAlgorithmDisplay();
        });
    }

    /**
     * アルゴリズムを設定
     */
    public async setAlgorithm(algorithm: AlgorithmType, updateMain: boolean = true): Promise<boolean> {
        if (this.locked) {
            this.log('Algorithm is locked, cannot change', 'warn');
            return false;
        }

        if (!['ternary', 'natural'].includes(algorithm)) {
            this.log(`Invalid algorithm: ${algorithm}`, 'error');
            return false;
        }

        this.log(`Setting algorithm to: ${algorithm}`, 'debug');
        this.currentAlgorithm = algorithm;
        
        const electronAPI = (window as any).electronAPI as ElectronAPI | undefined;
        if (updateMain && electronAPI && electronAPI.setAlgorithm) {
            try {
                await electronAPI.setAlgorithm(algorithm);
                this.log('Algorithm updated in main process', 'debug');
            } catch (error) {
                this.handleError(error instanceof Error ? error : new Error(String(error)), 'setAlgorithm');
            }
        }

        this.updateAlgorithmDisplay();
        this.resetAlgorithmState();
        
        return true;
    }

    /**
     * アルゴリズム表示を更新
     */
    private updateAlgorithmDisplay(): void {
        const currentAlgorithmElement = document.getElementById('currentAlgorithm');
        if (!currentAlgorithmElement) {
            this.log('currentAlgorithm element not found', 'warn');
            return;
        }

        const i18n = (window as any).I18N as I18NManager | undefined;
        const algorithmText = this.currentAlgorithm === 'ternary' 
            ? (i18n?.t('ui.algorithm.ternary') || '三分探索PSAメソッド')
            : (i18n?.t('ui.algorithm.natural') || 'ナチュラルPSAメソッド');

        currentAlgorithmElement.textContent = algorithmText;
    }

    /**
     * アルゴリズム選択をロック
     */
    public lock(showNotification: boolean = true): void {
        this.locked = true;
        this.log('Algorithm selection locked', 'debug');
        
        const electronAPI = (window as any).electronAPI as ElectronAPI | undefined;
        // メニューの無効化をメインプロセスに通知
        if (electronAPI && electronAPI.lockAlgorithmSelection) {
            try {
                electronAPI.lockAlgorithmSelection();
                
                // オプションで通知を表示
                if (showNotification) {
                    const i18n = (window as any).I18N as I18NManager | undefined;
                    const message = i18n?.t('notifications.algorithmLocked') || 'アルゴリズム選択がロックされました';
                    try {
                        this.notificationManager.show(message, 'info');
                    } catch (error) {
                        this.log('Failed to show notification:', 'warn', error);
                    }
                }
            } catch (error) {
                // メニューロックの通知に失敗しました
            }
        }
    }

    /**
     * アルゴリズム選択のロックを解除
     */
    public unlock(): void {
        this.locked = false;
        this.log('Algorithm selection unlocked', 'debug');
        
        const electronAPI = (window as any).electronAPI as ElectronAPI | undefined;
        // メインプロセスのロックも解除
        if (electronAPI && electronAPI.unlockAlgorithmSelection) {
            try {
                electronAPI.unlockAlgorithmSelection();
                
                // アンロック通知を表示
                const i18n = (window as any).I18N as I18NManager | undefined;
                const message = i18n?.t('notifications.algorithmUnlocked') || 'アルゴリズム選択のロックが解除されました';
                try {
                    this.notificationManager.show(message, 'info');
                } catch (error) {
                    this.log('Failed to show notification:', 'warn', error);
                }
            } catch (error) {
                // メニューロック解除の通知に失敗しました
            }
        }
    }

    /**
     * アルゴリズム状態をリセット
     */
    private resetAlgorithmState(): void {
        // 三分探索の状態をリセット
        this.inputDPI = 0;
        this.lowerBound = 0;
        this.upperBound = 0;
        this.leftThird = 0;
        this.rightThird = 0;

        // ナチュラルPSAの状態をリセット
        this.naturalState = {
            baseValue: 0,
            iterations: 0,
            history: []
        };

        this.log('Algorithm state reset', 'debug');
    }

    /**
     * 三分探索アルゴリズムの初期化
     */
    public initializeTernarySearch(dpi: number): TernaryInitResult {
        this.inputDPI = dpi;
        const baseSensi = this.settings.baseSensi / dpi;
        
        // DPIに基づいて動的に範囲を計算
        // 基準感度を中心とした範囲を設定
        const rangeMultiplier = this.settings.rangeMultiplier;
        this.lowerBound = baseSensi;  // 最小値は基準感度
        this.upperBound = baseSensi * rangeMultiplier;  // 最大値は基準感度 * 8
        
        // 初期候補を計算
        this.updateTernarySearchCandidates();
        
        const result: TernaryInitResult = { 
            leftThird: this.leftThird, 
            rightThird: this.rightThird,
            range: {
                min: this.lowerBound,
                max: this.upperBound
            }
        };
        
        this.log(`Ternary search initialized: DPI=${dpi}, base=${baseSensi.toFixed(3)}, range=${this.lowerBound.toFixed(3)}-${this.upperBound.toFixed(3)}`, 'info');
        this.log(`Returning result:`, 'debug', result);
        
        return result;
    }

    /**
     * 三分探索の候補を更新
     */
    private updateTernarySearchCandidates(): void {
        const range = this.upperBound - this.lowerBound;
        this.leftThird = this.lowerBound + range / 3;
        this.rightThird = this.upperBound - range / 3;
    }

    /**
     * 三分探索の次のステップ
     */
    public processTernarySearchChoice(choice: TernaryChoice): TernarySearchResult {
        const range = this.upperBound - this.lowerBound;
        
        if (range < this.settings.convergenceThreshold) {
            // 収束した
            const finalSensitivity = (this.lowerBound + this.upperBound) / 2;
            this.log(`Ternary search converged: ${finalSensitivity}`, 'info');
            return { converged: true, result: finalSensitivity };
        }

        switch (choice) {
            case 'left':
                this.upperBound = this.rightThird;
                break;
            case 'right':
                this.lowerBound = this.leftThird;
                break;
            case 'equal':
                this.lowerBound = this.leftThird;
                this.upperBound = this.rightThird;
                break;
        }

        this.updateTernarySearchCandidates();
        
        this.log(`Ternary search step: choice=${choice}, new range=[${this.lowerBound}, ${this.upperBound}]`, 'debug');
        return { 
            converged: false, 
            leftThird: this.leftThird, 
            rightThird: this.rightThird,
            range: {
                min: this.lowerBound,
                max: this.upperBound
            }
        };
    }

    /**
     * ナチュラルPSAアルゴリズムの初期化
     */
    public initializeNaturalPSA(dpi: number): NaturalInitResult {
        this.inputDPI = dpi;
        // リファクタリング前のロジック: naturalBaseA = 280 / input_DPI
        this.naturalState.baseValue = this.settings.naturalBaseSensi / dpi;
        this.naturalState.iterations = 0;
        this.naturalState.history = [];
        
        // 初期のd値はbaseValue（リファクタリング前と同じ）
        this.naturalState.currentD = this.naturalState.baseValue;
        
        // 試行回数に応じた乗算値を取得
        const multipliers = this.getNaturalMultipliers(this.naturalState.iterations);
        
        // b = d * 低い乗算値, c = d * 高い乗算値（リファクタリング前のleftThird、rightThirdと同等）
        const leftThird = this.roundUp(this.naturalState.currentD * multipliers.low, 3);
        const rightThird = this.roundUp(this.naturalState.currentD * multipliers.high, 3);
        
        this.log(`Natural PSA initialized: DPI=${dpi}, baseA=${this.naturalState.baseValue.toFixed(3)}, currentD=${this.naturalState.currentD.toFixed(3)}, candidates: ${leftThird.toFixed(3)} - ${rightThird.toFixed(3)}`, 'info');
        return {
            candidates: {
                candidateA: leftThird,
                candidateB: rightThird
            },
            range: {
                // Natural PSAでは範囲ではなくcurrentD値を表示
                currentD: this.naturalState.currentD
            }
        };
    }

    /**
     * Natural PSA メソッドの試行回数に応じた乗算値を取得
     */
    private getNaturalMultipliers(iteration: number): NaturalMultipliers {
        const multiplierTable: NaturalMultipliers[] = [
            { low: 0.5, high: 1.5 },   // 1回目表示 (iteration 0)
            { low: 0.5, high: 1.5 },   // 2回目表示 (iteration 1)
            { low: 0.6, high: 1.4 },   // 3回目表示 (iteration 2)
            { low: 0.7, high: 1.3 },   // 4回目表示 (iteration 3)
            { low: 0.8, high: 1.2 },   // 5回目表示 (iteration 4)
            { low: 0.9, high: 1.1 },   // 6回目表示 (iteration 5)
            { low: 0.95, high: 1.05 }  // 7回目表示 (iteration 6)
        ];
        
        const index = Math.min(iteration, 6);
        return multiplierTable[index];
    }
    
    /**
     * 小数第n位以降を繰り上げする
     */
    private roundUp(value: number, decimals: number): number {
        const factor = Math.pow(10, decimals);
        return Math.ceil(value * factor) / factor;
    }

    /**
     * ナチュラルPSAの次のステップ
     */
    public processNaturalPSAChoice(choice: TernaryChoice, currentCandidates: CandidatesPair): NaturalStepResult {
        // equal選択または7回目の選択で終了（リファクタリング前と同じ条件）
        if (choice === 'equal' || this.naturalState.iterations >= 6) {
            let finalSensitivity: number;
            if (choice === 'equal') {
                finalSensitivity = (currentCandidates.candidateA + currentCandidates.candidateB) / 2;
            } else {
                // 7回目の選択された感度を最終感度とする（リファクタリング前と同じ）
                finalSensitivity = choice === 'left' ? currentCandidates.candidateA : currentCandidates.candidateB;
            }
            this.log(`Natural PSA completed: ${finalSensitivity}`, 'info');
            return { completed: true, result: finalSensitivity };
        }

        // 選択された値を取得（リファクタリング前と同じ）
        const selectedValue = choice === 'left' ? currentCandidates.candidateA : currentCandidates.candidateB;
        
        // 新しいd値 = (選択された値 + 前回のd) / 2（リファクタリング前と同じ計算）
        const previousD = this.naturalState.currentD!;
        this.naturalState.currentD = (selectedValue + previousD) / 2;
        
        // 試行回数をインクリメント（リファクタリング前と同じタイミング）
        this.naturalState.iterations++;
        
        // 履歴に追加
        this.naturalState.history.push({
            iteration: this.naturalState.iterations,
            choice,
            selectedValue,
            previousD,
            newD: this.naturalState.currentD
        });

        // 現在の試行回数に基づいて次の乗算値を取得（リファクタリング前と同じ）
        const multipliers = this.getNaturalMultipliers(this.naturalState.iterations);
        
        // 新しいペアを生成: d*低乗算値 と d*高乗算値 (小数第3位以降は繰り上げ)（リファクタリング前と同じ）
        const leftThird = this.roundUp(this.naturalState.currentD * multipliers.low, 3);
        const rightThird = this.roundUp(this.naturalState.currentD * multipliers.high, 3);

        this.log(`Natural PSA step: iteration=${this.naturalState.iterations}, choice=${choice}, newD=${this.naturalState.currentD.toFixed(3)}, candidates: ${leftThird.toFixed(3)} - ${rightThird.toFixed(3)}`, 'debug');
        
        return { 
            completed: false, 
            candidates: {
                candidateA: leftThird,
                candidateB: rightThird
            },
            range: {
                currentD: this.naturalState.currentD
            }
        };
    }

    /**
     * 現在のアルゴリズムを取得
     */
    public getCurrentAlgorithm(): AlgorithmType {
        return this.currentAlgorithm;
    }

    /**
     * ロック状態を取得
     */
    public isLocked(): boolean {
        return this.locked;
    }

    /**
     * アルゴリズムの統計情報を取得
     */
    public getStatistics(): AlgorithmStatistics {
        return {
            algorithm: this.currentAlgorithm,
            isLocked: this.locked,
            ternarySearch: {
                dpi: this.inputDPI,
                range: [this.lowerBound, this.upperBound],
                candidates: [this.leftThird, this.rightThird]
            },
            naturalPSA: {
                iterations: this.naturalState.iterations,
                history: this.naturalState.history
            }
        };
    }

    /**
     * クリーンアップ処理
     */
    public destroy(): void {
        this.resetAlgorithmState();
        super.destroy();
        this.log('AlgorithmManager destroyed', 'info');
    }
}

// Export for both ES6 modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AlgorithmManager };
} else if (typeof window !== 'undefined') {
    (window as any).AlgorithmManager = AlgorithmManager;
}

export default AlgorithmManager;
