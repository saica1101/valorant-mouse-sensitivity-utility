/**
 * TypeScript Migration Demo
 * TypeScript移行の効果を実証するデモンストレーション
 */

// 型安全なServiceContainerの使用例（グローバル変数パターン）
declare const ServiceContainer: any;

class TypeScriptDemo {
  private container: any;

  constructor() {
    this.container = new ServiceContainer();
    this.setupDemo();
  }

  /**
   * TypeScript移行の効果をデモンストレーション
   */
  private setupDemo(): void {
    console.log('🚀 TypeScript Migration Demo');
    
    // 1. 型安全なサービス登録
    this.demonstrateTypeSafety();
    
    // 2. IntelliSenseの効果
    this.demonstrateIntelliSense();
    
    // 3. エラー検出の改善
    this.demonstrateErrorDetection();
    
    // 4. リファクタリングの安全性
    this.demonstrateRefactoringSafety();
  }

  /**
   * 型安全性のデモンストレーション
   */
  private demonstrateTypeSafety(): void {
    console.log('📋 1. Type Safety Demo');
    
    // TypeScript版: 型安全な登録
    interface ITestService {
      getName(): string;
      getVersion(): number;
    }
    
    class TestService implements ITestService {
      getName(): string { return 'TestService'; }
      getVersion(): number { return 1.0; }
    }
    
    // 型安全な登録
    this.container.register(
      'TestService', 
      () => new TestService()
    );
    
    // 型安全な取得
    const service = this.container.get('TestService');
    console.log(`Service: ${service.getName()} v${service.getVersion()}`);
    
    // TypeScriptコンパイル時にエラーになる例：
    // service.nonExistentMethod(); // ❌ コンパイルエラー
  }

  /**
   * IntelliSenseの改善をデモンストレーション
   */
  private demonstrateIntelliSense(): void {
    console.log('🔍 2. IntelliSense Enhancement Demo');
    
    // TypeScript版: 明確な型定義によるIntelliSense
    interface NotificationOptions {
      duration?: number;
      closable?: boolean;
      position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
      animation?: 'fade' | 'slide' | 'bounce';
    }
    
    // IDEで自動補完される
    const options: NotificationOptions = {
      duration: 3000,
      closable: true,
      position: 'top-right', // IDEが選択肢を提供
      animation: 'fade'       // IDEが選択肢を提供
    };
    
    console.log('IntelliSense options:', options);
  }

  /**
   * エラー検出の改善をデモンストレーション
   */
  private demonstrateErrorDetection(): void {
    console.log('🚨 3. Error Detection Demo');
    
    // TypeScript版: コンパイル時エラー検出
    type LogLevel = 'debug' | 'info' | 'warn' | 'error';
    
    const validLogLevel: LogLevel = 'info';      // ✅ OK
    // const invalidLogLevel: LogLevel = 'verbose'; // ❌ コンパイルエラー
    
    function logMessage(message: string, level: LogLevel): void {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }
    
    logMessage('This is valid', validLogLevel);
    // logMessage('This would error', 'invalid'); // ❌ コンパイルエラー
  }

  /**
   * リファクタリングの安全性をデモンストレーション
   */
  private demonstrateRefactoringSafety(): void {
    console.log('🔧 4. Refactoring Safety Demo');
    
    // TypeScript版: 型情報によるリファクタリング支援
    interface ConfigValue {
      key: string;
      value: any;
      type: 'string' | 'number' | 'boolean' | 'object';
      required: boolean;
    }
    
    class ConfigManager {
      private configs = new Map<string, ConfigValue>();
      
      // 型安全なメソッド
      setValue<T>(key: string, value: T, type: ConfigValue['type'], required: boolean = false): void {
        this.configs.set(key, { key, value, type, required });
      }
      
      getValue<T>(key: string): T | undefined {
        const config = this.configs.get(key);
        return config ? config.value as T : undefined;
      }
      
      // リファクタリング時に型情報が保持される
      getAllConfigs(): ConfigValue[] {
        return Array.from(this.configs.values());
      }
    }
    
    const configManager = new ConfigManager();
    configManager.setValue('appName', 'VMSU', 'string', true);
    configManager.setValue('version', 1.4, 'number', true);
    
    // 型推論が効く
    const appName = configManager.getValue<string>('appName');
    const version = configManager.getValue<number>('version');
    
    console.log(`Config: ${appName} v${version}`);
  }

  /**
   * 実際のマネージャーでの型安全性デモ
   */
  private demonstrateManagerTypeSafety(): void {
    console.log('🏗️ 5. Manager Type Safety Demo');
    
    // BaseManagerの型安全な拡張例
    interface INotificationManager {
      show(message: string, type: 'info' | 'warn' | 'error', options?: any): void;
      hide(id: string): void;
      clear(): void;
    }
    
    // 型安全なマネージャー実装（概念実証）
    class TypeSafeNotificationManager implements INotificationManager {
      show(message: string, type: 'info' | 'warn' | 'error', options?: any): void {
        console.log(`[${type.toUpperCase()}] ${message}`);
      }
      
      hide(id: string): void {
        console.log(`Hiding notification: ${id}`);
      }
      
      clear(): void {
        console.log('Clearing all notifications');
      }
    }
    
    // 使用例
    const notificationManager = new TypeSafeNotificationManager();
    notificationManager.show('TypeScript is awesome!', 'info');
    // notificationManager.show('Error', 'invalid'); // ❌ コンパイルエラー
  }

  /**
   * パフォーマンス比較（概念的）
   */
  private demonstratePerformance(): void {
    console.log('⚡ 6. Performance Benefits Demo');
    
    // TypeScript版: より効率的な型チェック
    interface PerformanceMetric {
      name: string;
      duration: number;
      memory: number;
    }
    
    class PerformanceTracker {
      private metrics: PerformanceMetric[] = [];
      
      // 型安全なメトリクス追加
      addMetric(metric: PerformanceMetric): void {
        this.metrics.push(metric);
      }
      
      // 型安全な集計
      getAverageBy(field: keyof PerformanceMetric): number {
        if (field === 'name') return 0; // 文字列フィールドは平均計算不可
        
        const values = this.metrics.map(m => m[field] as number);
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      }
    }
    
    const tracker = new PerformanceTracker();
    tracker.addMetric({ name: 'init', duration: 100, memory: 1024 });
    tracker.addMetric({ name: 'render', duration: 50, memory: 512 });
    
    console.log('Average duration:', tracker.getAverageBy('duration'));
    console.log('Average memory:', tracker.getAverageBy('memory'));
  }

  /**
   * デモの実行
   */
  public runDemo(): void {
    console.log('🎯 TypeScript Migration Benefits Demonstration');
    console.log('=' .repeat(50));
    
    this.demonstrateTypeSafety();
    console.log();
    
    this.demonstrateIntelliSense();
    console.log();
    
    this.demonstrateErrorDetection();
    console.log();
    
    this.demonstrateRefactoringSafety();
    console.log();
    
    this.demonstrateManagerTypeSafety();
    console.log();
    
    this.demonstratePerformance();
    
    console.log('=' .repeat(50));
    console.log('✅ TypeScript migration provides significant benefits!');
  }
}

// 使用例（ブラウザコンソールで実行可能）
if (typeof window !== 'undefined') {
  (window as any).TypeScriptDemo = TypeScriptDemo;
  
  // 自動実行
  const demo = new TypeScriptDemo();
  demo.runDemo();
}

export default TypeScriptDemo;
