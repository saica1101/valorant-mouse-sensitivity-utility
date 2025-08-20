/**
 * Common Type Definitions for Valorant Mouse Sensitivity Utility
 * TypeScript共通型定義
 */

// ===== Core Interfaces =====

/**
 * 設定オブジェクトの型定義
 */
export interface AppConfig {
  BASE_SENSI: number;
  ALGORITHM: {
    MIN_SENSI: number;
    MAX_SENSI: number;
    RANGE_MULTIPLIER: number;
    CONVERGENCE_THRESHOLD: number;
  };
  DPI_PRESETS: number[];
  VALIDATION: {
    MIN_DPI: number;
    MAX_DPI: number;
    MIN_SENSI: number;
    MAX_SENSI: number;
  };
  UI: {
    ERROR_DISPLAY_DURATION: number;
    SUCCESS_DISPLAY_DURATION: number;
    ANIMATION_DURATION: number;
    DECIMAL_PLACES: number;
  };
  THEME: {
    DEFAULT: string;
    STORAGE_KEY: string;
  };
  I18N: {
    DEFAULT_LANGUAGE: string;
    SUPPORTED_LANGUAGES: string[];
    STORAGE_KEY: string;
  };
  ACCESSIBILITY: {
    FOCUS_TRAP: boolean;
    HIGH_CONTRAST: boolean;
    SCREEN_READER_SUPPORT: boolean;
    KEYBOARD_NAVIGATION: boolean;
    FOCUS_INDICATOR_WIDTH: number;
    TAB_INDEX_START: number;
  };
  PERFORMANCE: {
    DEBOUNCE_DELAY: number;
    THROTTLE_DELAY: number;
    LAZY_LOAD: boolean;
    VIRTUAL_SCROLL: boolean;
    CACHE_SIZE: number;
  };
  APP: {
    NAME: string;
    FULL_NAME: string;
    DESCRIPTION: string;
    FALLBACK_VERSION: string;
  };
}

/**
 * ログレベルの定義
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 通知タイプの定義
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * アルゴリズムタイプの定義
 */
export type AlgorithmType = 'ternary' | 'natural';

/**
 * UIフェーズの定義
 */
export type UIPhase = 'setup' | 'adjustment' | 'complete';

// ===== Service Container Types =====

/**
 * サービスファクトリー関数の型
 */
export type ServiceFactory<T = any> = (container: IServiceContainer) => T;

/**
 * ServiceContainerインターフェース
 */
export interface IServiceContainer {
  register<T>(name: string, factory: ServiceFactory<T>, singleton?: boolean): IServiceContainer;
  get<T>(name: string): T;
  has(name: string): boolean;
  resolve(dependencies: Record<string, string>): Record<string, any>;
  initializeAll(serviceNames: string[]): Promise<void>;
  getRegisteredServices(): string[];
}

// ===== Manager Interfaces =====

/**
 * BaseManagerインターフェース
 */
export interface IBaseManager {
  readonly isInitialized: boolean;
  readonly config: Partial<AppConfig>;
  readonly container: IServiceContainer | null;
  
  init(): Promise<void>;
  destroy(): void;
  log(message: string, level: LogLevel, ...args: any[]): void;
  getConfig<T>(key: string, defaultValue?: T): T;
  getDependency<T>(serviceName: string): T;
  resolveDependencies(serviceNames: string[]): Record<string, any>;
}

/**
 * NotificationManagerインターフェース
 */
export interface INotificationManager extends IBaseManager {
  show(message: string, type: NotificationType, options?: NotificationOptions): void;
  hide(id: string): void;
  clear(): void;
  getActiveNotifications(): NotificationInfo[];
}

/**
 * ValidationManagerインターフェース
 */
export interface IValidationManager extends IBaseManager {
  validateDPI(value: number): ValidationResult;
  validateSensitivity(value: number): ValidationResult;
  addRule(name: string, rule: ValidationRule): void;
  removeRule(name: string): void;
  validateField(fieldName: string, value: any): ValidationResult;
}

/**
 * UIManagerインターフェース
 */
export interface IUIManager extends IBaseManager {
  readonly currentPhase: UIPhase;
  transitionTo(phase: UIPhase, options?: TransitionOptions): Promise<void>;
  showElement(elementId: string, animate?: boolean): void;
  hideElement(elementId: string, animate?: boolean): void;
  updateDisplay(): void;
}

/**
 * AlgorithmManagerインターフェース
 */
export interface IAlgorithmManager extends IBaseManager {
  readonly currentAlgorithm: AlgorithmType;
  readonly isLocked: boolean;
  
  setAlgorithm(algorithm: AlgorithmType): Promise<void>;
  lock(showNotification?: boolean): Promise<void>;
  unlock(): Promise<void>;
  calculate(inputDPI: number): AlgorithmResult;
}

/**
 * AccessibilityManagerインターフェース
 */
export interface IAccessibilityManager extends IBaseManager {
  announce(message: string, priority?: 'polite' | 'assertive'): void;
  updateAriaLabels(): void;
  setupKeyboardNavigation(): void;
}

// ===== Data Types =====

/**
 * 通知オプション
 */
export interface NotificationOptions {
  duration?: number;
  closable?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  animation?: boolean;
}

/**
 * 通知情報
 */
export interface NotificationInfo {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: number;
  options: NotificationOptions;
}

/**
 * バリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  value?: any;
}

/**
 * バリデーションルール
 */
export interface ValidationRule {
  name: string;
  validator: (value: any) => boolean;
  message: string;
  priority?: number;
}

/**
 * フェーズ遷移オプション
 */
export interface TransitionOptions {
  animate?: boolean;
  duration?: number;
  preserveData?: boolean;
  force?: boolean;
}

/**
 * アルゴリズム計算結果
 */
export interface AlgorithmResult {
  sensitivity: number;
  steps: AlgorithmStep[];
  completed: boolean;
  metadata?: Record<string, any>;
}

/**
 * アルゴリズムステップ
 */
export interface AlgorithmStep {
  step: number;
  leftValue: number;
  rightValue: number;
  choice?: 'left' | 'right';
  timestamp: number;
}

/**
 * アルゴリズム状態
 */
export interface AlgorithmState {
  type: AlgorithmType;
  isLocked: boolean;
  inputDPI: number;
  lowerBound: number;
  upperBound: number;
  leftThird?: number;
  rightThird?: number;
  history: AlgorithmStep[];
}

// ===== Event Types =====

/**
 * カスタムイベントデータ
 */
export interface CustomEventData {
  source: string;
  type: string;
  data: any;
  timestamp: number;
}

/**
 * エラーハンドラー関数の型
 */
export type ErrorHandler = (error: Error, context?: string) => void;

/**
 * イベントリスナー関数の型
 */
export type EventListener = (event: CustomEventData) => void;

// ===== Utility Types =====

/**
 * 部分的な設定更新用の型
 */
export type ConfigUpdate = Partial<AppConfig>;

/**
 * マネージャー初期化設定
 */
export interface ManagerInitConfig {
  config?: Partial<AppConfig>;
  container?: IServiceContainer;
  skipInit?: boolean;
}

/**
 * パフォーマンス測定結果
 */
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// ===== Global Declarations =====

declare global {
  interface Window {
    CONFIG: AppConfig;
    I18N: any;
    electronAPI: any;
    serviceContainer: IServiceContainer;
    
    // レガシーマネージャー参照（段階的削除予定）
    NotificationManager: INotificationManager;
    ValidationManager: IValidationManager;
    UIManager: IUIManager;
    AlgorithmManager: IAlgorithmManager;
    AccessibilityManager: IAccessibilityManager;
  }
}
