/**
 * Performance Manager - TypeScript版
 * パフォーマンス最適化マネージャー
 */

// 型定義
interface PerformanceMetrics {
    renderTime: number[];
    memoryUsage: number[];
    eventProcessingTime: number[];
    frameRate: number[];
    domOperations: number[];
}

interface TimerInfo {
    startTime: number;
    endTime?: number;
    description?: string;
    category?: string;
}

interface CacheEntry<T> {
    value: T;
    timestamp: number;
    ttl: number;
    hitCount: number;
}

interface IServiceContainer {
    register<T>(name: string, factory: any, singleton?: boolean): IServiceContainer;
    get<T>(name: string): T;
    has(name: string): boolean;
    resolve(dependencies: Record<string, string>): Record<string, any>;
    initializeAll(serviceNames: string[]): Promise<void>;
    getRegisteredServices(): string[];
}

/**
 * PerformanceManager - 軽量実装
 * BaseManagerに依存せず独立して動作
 */
class PerformanceManager {
    private static instance: PerformanceManager | null = null;
    private config: any;
    private container: IServiceContainer | null;
    private isInitialized: boolean = false;
    
    private timers: Map<string, TimerInfo> = new Map();
    private cache: Map<string, CacheEntry<any>> = new Map();
    private metrics: PerformanceMetrics;
    private isMonitoring: boolean = false;
    private monitoringInterval: number | null = null;

    constructor(config: any = {}, container: IServiceContainer | null = null) {
        this.config = { ...(window as any).CONFIG, ...config };
        this.container = container;
        
        this.metrics = {
            renderTime: [],
            memoryUsage: [],
            eventProcessingTime: [],
            frameRate: [],
            domOperations: []
        };

        console.log('⚡ PerformanceManager initialized');
    }

    /**
     * シングルトンインスタンス取得
     */
    static getInstance(config?: any, container?: IServiceContainer): PerformanceManager {
        if (!PerformanceManager.instance) {
            PerformanceManager.instance = new PerformanceManager(config, container);
        }
        return PerformanceManager.instance;
    }

    /**
     * 初期化処理
     */
    async init(): Promise<void> {
        if (this.isInitialized) return;
        
        try {
            await this.doInit();
            this.isInitialized = true;
            this.log('Manager initialized successfully', 'info');
        } catch (error) {
            this.log('Error during initialization', 'error', error);
            throw error;
        }
    }

    /**
     * 実際の初期化処理
     */
    protected async doInit(): Promise<void> {
        this.startMonitoring();
        this.setupCleanupInterval();
        this.log('PerformanceManager initialization completed', 'info');
    }

    /**
     * 設定値の取得（ドット記法対応）
     */
    private getConfig<T>(key: string, defaultValue?: T): T {
        const keys = key.split('.');
        let current: any = this.config;
        
        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            } else {
                return defaultValue as T;
            }
        }
        
        return current !== undefined ? current : defaultValue as T;
    }

    /**
     * ログ出力
     */
    private log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info', ...args: any[]): void {
        const timestamp = new Date().toISOString();
        const className = this.constructor.name;
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${className}: ${message}`;
        
        switch (level) {
            case 'debug':
                console.debug(logMessage, ...args);
                break;
            case 'info':
                console.info(logMessage, ...args);
                break;
            case 'warn':
                console.warn(logMessage, ...args);
                break;
            case 'error':
                console.error(logMessage, ...args);
                break;
        }
    }

    /**
     * 監視開始
     */
    private startMonitoring(): void {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.monitoringInterval = window.setInterval(() => {
            this.recordMemoryUsage();
        }, this.getConfig('PERFORMANCE.MONITORING_INTERVAL', 1000));
        
        this.log('Performance monitoring started', 'debug');
    }

    /**
     * クリーンアップ間隔設定
     */
    private setupCleanupInterval(): void {
        setInterval(() => {
            this.cleanupOldEntries();
        }, this.getConfig('PERFORMANCE.CLEANUP_INTERVAL', 60000));
    }

    /**
     * 古いエントリのクリーンアップ
     */
    private cleanupOldEntries(): void {
        const now = Date.now();
        const maxAge = this.getConfig('PERFORMANCE.MAX_CACHE_AGE', 3600000); // 1時間
        
        // キャッシュのクリーンアップ
        for (const [key, entry] of this.cache.entries()) {
            if (entry.ttl && now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
            }
        }
        
        // 完了したタイマーのクリーンアップ
        for (const [key, timer] of this.timers.entries()) {
            if (timer.endTime && now - timer.endTime > maxAge) {
                this.timers.delete(key);
            }
        }
    }

    /**
     * パフォーマンス計測開始
     */
    startTimer(name: string, description?: string, category?: string): void {
        this.timers.set(name, {
            startTime: performance.now(),
            description,
            category
        });
    }

    /**
     * パフォーマンス計測終了
     */
    endTimer(name: string): number | null {
        const timer = this.timers.get(name);
        if (!timer) {
            this.log(`Timer "${name}" not found`, 'warn');
            return null;
        }

        const endTime = performance.now();
        const duration = endTime - timer.startTime;

        timer.endTime = endTime;

        // メトリクスに記録
        this.metrics.eventProcessingTime.push(duration);

        // 最大100件保持
        if (this.metrics.eventProcessingTime.length > 100) {
            this.metrics.eventProcessingTime = this.metrics.eventProcessingTime.slice(-100);
        }

        this.log(`Timer "${name}": ${duration.toFixed(2)}ms${timer.description ? ` (${timer.description})` : ''}`, 'debug');

        return duration;
    }

    /**
     * メモリ使用量を記録
     */
    recordMemoryUsage(): void {
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            this.metrics.memoryUsage.push(memory.usedJSHeapSize);

            // 最大100件保持
            if (this.metrics.memoryUsage.length > 100) {
                this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
            }
        }
    }

    /**
     * キャッシュから取得
     */
    getFromCache<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        
        // TTLチェック
        if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        entry.hitCount++;
        return entry.value as T;
    }

    /**
     * データをキャッシュに保存
     */
    setToCache<T>(key: string, value: T, ttl?: number): void {
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl: ttl || this.getConfig('PERFORMANCE.DEFAULT_TTL', 300000), // 5分
            hitCount: 0
        });
    }

    /**
     * パフォーマンスメトリクスを取得
     */
    getMetrics(): PerformanceMetrics {
        return {
            renderTime: [...this.metrics.renderTime],
            memoryUsage: [...this.metrics.memoryUsage],
            eventProcessingTime: [...this.metrics.eventProcessingTime],
            frameRate: [...this.metrics.frameRate],
            domOperations: [...this.metrics.domOperations]
        };
    }

    /**
     * 関数の実行時間を計測
     */
    async measureExecution<T>(name: string, func: () => Promise<T> | T): Promise<{ result: T; duration: number }> {
        this.startTimer(name);
        try {
            const result = await func();
            const duration = this.endTimer(name) || 0;
            return { result, duration };
        } catch (error) {
            this.endTimer(name);
            throw error;
        }
    }

    /**
     * 有効状態チェック
     */
    isEnabled(): boolean {
        return this.isMonitoring;
    }

    /**
     * 監視停止
     */
    stopMonitoring(): void {
        if (!this.isMonitoring) return;

        this.isMonitoring = false;
        
        if (this.monitoringInterval !== null) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        this.log('Performance monitoring stopped', 'debug');
    }

    /**
     * クリーンアップ
     */
    destroy(): void {
        try {
            this.stopMonitoring();
            this.cache.clear();
            this.timers.clear();
            
            // データのクリーンアップ
            this.metrics = {
                renderTime: [],
                memoryUsage: [],
                eventProcessingTime: [],
                frameRate: [],
                domOperations: []
            };
            
            this.isInitialized = false;
            this.log('Manager destroyed', 'info');
        } catch (error) {
            this.log('Error during cleanup', 'error', error);
        }
    }
}

// グローバル参照を設定
(window as any).PerformanceManager = PerformanceManager;

export default PerformanceManager;
