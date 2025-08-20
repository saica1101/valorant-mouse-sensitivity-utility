/**
 * Service Container - 依存関係管理
 * グローバル汚染を解決し、適切な依存関係注入を実現
 * TypeScript版
 */

// 型定義（開発時のみ）
interface IServiceContainer {
  register<T>(name: string, factory: ServiceFactory<T>, singleton?: boolean): IServiceContainer;
  get<T>(name: string): T;
  has(name: string): boolean;
  resolve(dependencies: Record<string, string>): Record<string, any>;
  initializeAll(serviceNames: string[]): Promise<void>;
  getRegisteredServices(): string[];
}

interface IBaseManager {
  readonly isInitialized: boolean;
  init(): Promise<void>;
  destroy?(): void;
}

type ServiceFactory<T = any> = (container: IServiceContainer) => T;

class ServiceContainer implements IServiceContainer {
  private services = new Map<string, any>();
  private singletons = new Map<string, any>();
  private factories = new Map<string, ServiceFactory>();
  private initializing = new Set<string>();

  /**
   * サービスを登録
   * @param name - サービス名
   * @param factory - ファクトリー関数
   * @param singleton - シングルトンかどうか
   */
  register<T>(name: string, factory: ServiceFactory<T>, singleton: boolean = true): IServiceContainer {
    this.factories.set(name, factory);
    if (singleton) {
      this.singletons.set(name, null);
    }
    return this;
  }

  /**
   * サービスを取得
   * @param name - サービス名
   * @returns サービスインスタンス
   */
  get<T>(name: string): T {
    // 循環依存のチェック
    if (this.initializing.has(name)) {
      throw new Error(`Circular dependency detected: ${name}`);
    }

    // シングルトンの場合
    if (this.singletons.has(name)) {
      let instance = this.singletons.get(name);
      if (!instance) {
        this.initializing.add(name);
        try {
          const factory = this.factories.get(name);
          if (!factory) {
            throw new Error(`Service not found: ${name}`);
          }
          instance = factory(this);
          this.singletons.set(name, instance);
        } finally {
          this.initializing.delete(name);
        }
      }
      return instance as T;
    }

    // 新しいインスタンスを毎回作成
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Service not found: ${name}`);
    }
    return factory(this) as T;
  }

  /**
   * 依存関係の一括解決
   * @param dependencies - 依存関係定義
   * @returns 解決された依存関係
   */
  resolve(dependencies: Record<string, string>): Record<string, any> {
    const resolved: Record<string, any> = {};
    for (const [key, serviceName] of Object.entries(dependencies)) {
      resolved[key] = this.get(serviceName);
    }
    return resolved;
  }

  /**
   * サービスが登録されているかチェック
   * @param name - サービス名
   * @returns 登録状況
   */
  has(name: string): boolean {
    return this.factories.has(name);
  }

  /**
   * 全サービスを初期化
   * @param serviceNames - 初期化するサービス名の配列
   */
  async initializeAll(serviceNames: string[]): Promise<void> {
    for (const serviceName of serviceNames) {
      const service = this.get<any>(serviceName);
      if (service && typeof service.init === 'function') {
        await (service as IBaseManager).init();
      }
    }
  }

  /**
   * デバッグ用：登録されているサービス一覧を取得
   */
  getRegisteredServices(): string[] {
    return Array.from(this.factories.keys());
  }

  /**
   * デバッグ情報の出力
   */
  debug(): void {
    console.log('🔍 ServiceContainer Debug Info:');
    console.log('📦 Registered Services:', this.getRegisteredServices());
    console.log('🏷️ Singletons:', Array.from(this.singletons.keys()));
    console.log('⚡ Currently Initializing:', Array.from(this.initializing));
  }

  /**
   * 依存関係グラフの可視化（開発用）
   */
  getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    
    // 各サービスの依存関係を分析
    // 注意: これは簡易版の実装です
    for (const serviceName of this.getRegisteredServices()) {
      graph[serviceName] = []; // 実際の実装では依存関係を解析
    }
    
    return graph;
  }

  /**
   * メモリリークの検出（開発用）
   */
  detectMemoryLeaks(): void {
    const instances = Array.from(this.singletons.values()).filter(v => v !== null);
    console.log(`📊 Active Singleton Instances: ${instances.length}`);
    
    // メモリ使用量の確認（可能な場合）
    if (typeof window !== 'undefined' && window.performance && (window.performance as any).memory) {
      const memory = (window.performance as any).memory;
      console.log('💾 Memory Usage:', {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
      });
    }
  }

  /**
   * サービスの安全な破棄
   */
  destroy(): void {
    // 全シングルトンを破棄
    for (const [name, instance] of this.singletons.entries()) {
      if (instance && typeof instance.destroy === 'function') {
        try {
          instance.destroy();
        } catch (error) {
          console.warn(`Failed to destroy service ${name}:`, error);
        }
      }
    }

    // 内部状態をクリア
    this.singletons.clear();
    this.factories.clear();
    this.services.clear();
    this.initializing.clear();
  }
}

// グローバルアクセス用（移行期間中）
if (typeof window !== 'undefined') {
  (window as any).ServiceContainer = ServiceContainer;
}
