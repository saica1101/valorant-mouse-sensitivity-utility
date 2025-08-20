/**
 * Base Manager Class - TypeScript版
 * 全マネージャーの基底クラス
 */

// 基本型定義
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface BaseAppConfig {
  [key: string]: any;
}

interface IServiceContainer {
  register<T>(name: string, factory: any, singleton?: boolean): IServiceContainer;
  get<T>(name: string): T;
  has(name: string): boolean;
  resolve(dependencies: Record<string, string>): Record<string, any>;
  initializeAll(serviceNames: string[]): Promise<void>;
  getRegisteredServices(): string[];
}

interface ErrorHandler {
  (error: Error, context?: string): void;
}

interface EventListener {
  (event: any): void;
}

abstract class BaseManager {
  protected config: any;
  protected container: IServiceContainer | null;
  protected isInitialized: boolean = false;
  protected errorHandlers = new Map<string, ErrorHandler>();
  protected eventListeners = new Map<string, EventListener[]>();

  constructor(config: any = {}, container: IServiceContainer | null = null) {
    this.config = { ...(window as any).CONFIG, ...config };
    this.container = container;
  }

  /**
   * 初期化処理（サブクラスでオーバーライド）
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.doInit();
      this.isInitialized = true;
      this.log('Manager initialized successfully', 'info');
    } catch (error) {
      this.handleError(error as Error, 'init');
      throw error;
    }
  }

  /**
   * 実際の初期化処理（サブクラスで実装）
   */
  protected abstract doInit(): Promise<void>;

  /**
   * クリーンアップ処理
   */
  destroy(): void {
    try {
      this.clearEventListeners();
      this.clearErrorHandlers();
      this.isInitialized = false;
      this.log('Manager destroyed', 'info');
    } catch (error) {
      this.log('Error during cleanup', 'error', error);
    }
  }

  /**
   * 設定値の取得（ドット記法対応）
   */
  getConfig<T>(key: string, defaultValue?: T): T {
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
  log(message: string, level: LogLevel = 'info', ...args: any[]): void {
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
   * エラーハンドリング
   */
  protected handleError(error: Error, context?: string): void {
    const errorKey = context || 'default';
    const handler = this.errorHandlers.get(errorKey);
    
    if (handler) {
      try {
        handler(error, context);
      } catch (handlerError) {
        this.log('Error in error handler', 'error', handlerError);
      }
    } else {
      this.log(`Unhandled error in ${context || 'unknown context'}`, 'error', error);
    }
  }

  /**
   * エラーハンドラーの登録
   */
  protected addErrorHandler(key: string, handler: ErrorHandler): void {
    this.errorHandlers.set(key, handler);
  }

  /**
   * エラーハンドラーの削除
   */
  protected removeErrorHandler(key: string): void {
    this.errorHandlers.delete(key);
  }

  /**
   * 全エラーハンドラーのクリア
   */
  protected clearErrorHandlers(): void {
    this.errorHandlers.clear();
  }

  /**
   * イベントリスナーの追加
   */
  protected addEventListener(event: string, listener: EventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * イベントリスナーの削除
   */
  protected removeEventListener(event: string, listener: EventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 全イベントリスナーのクリア
   */
  protected clearEventListeners(): void {
    this.eventListeners.clear();
  }

  /**
   * イベントの発行
   */
  protected emitEvent(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const eventData = {
        type: event,
        source: this.constructor.name,
        data,
        timestamp: Date.now()
      };
      
      listeners.forEach(listener => {
        try {
          listener(eventData);
        } catch (error) {
          this.log('Error in event listener', 'error', error);
        }
      });
    }
  }

  /**
   * デバウンス関数
   */
  protected debounce<T extends (...args: any[]) => any>(
    func: T, 
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: number | null = null;
    return (...args: Parameters<T>) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * スロットル関数
   */
  protected throttle<T extends (...args: any[]) => any>(
    func: T, 
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func.apply(this, args);
      }
    };
  }

  /**
   * 依存関係の解決（DIコンテナ経由またはレガシーのwindowオブジェクト経由）
   */
  protected getDependency<T>(serviceName: string): T {
    // DIコンテナがある場合はそれを使用
    if (this.container && this.container.has && this.container.has(serviceName)) {
      return this.container.get<T>(serviceName);
    }
    
    // フォールバック：レガシーのwindowオブジェクト経由
    const legacyName = serviceName.endsWith('Manager') ? serviceName : `${serviceName}Manager`;
    const windowAny = window as any;
    if (windowAny[legacyName]) {
      return windowAny[legacyName] as T;
    }
    
    throw new Error(`Dependency not found: ${serviceName}`);
  }

  /**
   * 依存関係の一括解決
   */
  protected resolveDependencies(serviceNames: string[]): Record<string, any> {
    const dependencies: Record<string, any> = {};
    for (const serviceName of serviceNames) {
      dependencies[serviceName] = this.getDependency(serviceName);
    }
    return dependencies;
  }

  /**
   * 安全な非同期操作の実行
   */
  protected async safeAsync<T>(
    operation: () => Promise<T>, 
    errorMessage: string = 'Async operation failed'
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.log(errorMessage, 'error', error);
      return null;
    }
  }

  /**
   * 条件付き実行
   */
  protected executeIf(condition: boolean, operation: () => void): void {
    if (condition) {
      try {
        operation();
      } catch (error) {
        this.log('Conditional execution failed', 'error', error);
      }
    }
  }

  /**
   * リトライ機能付き実行
   */
  protected async retryAsync<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        this.log(`Attempt ${attempt} failed`, 'warn', error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }
}

// Export for both ES6 modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BaseManager };
} else if (typeof window !== 'undefined') {
  (window as any).BaseManager = BaseManager;
}
