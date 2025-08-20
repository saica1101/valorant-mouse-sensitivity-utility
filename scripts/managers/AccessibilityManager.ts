/**
 * Accessibility Manager - TypeScript版
 * アクセシビリティ管理クラス
 */

// 型定義
type AnnounceLevel = 'polite' | 'assertive' | 'off';

interface FocusManager {
    currentFocus: HTMLElement | null;
    focusableElements: HTMLElement[];
    trapFocus: boolean;
}

interface AccessibilitySettings {
    keyboardNavigation: boolean;
    screenReaderSupport: boolean;
    announcements: boolean;
    focusTrapping: boolean;
    ariaSupport: boolean;
}

interface AnnouncementEntry {
    message: string;
    priority: AnnounceLevel;
    timestamp: number;
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
    ACCESSIBILITY?: {
        KEYBOARD_NAVIGATION?: boolean;
        SCREEN_READER_SUPPORT?: boolean;
        FOCUS_TRAPPING?: boolean;
        ANNOUNCEMENT_DELAY?: number;
    };
    [key: string]: any;
}

/**
 * AccessibilityManager - 軽量実装
 * BaseManagerに依存せず独立して動作
 */
class AccessibilityManager {
    private static instance: AccessibilityManager | null = null;
    private config: any;
    private container: IServiceContainer | null;
    private isInitialized: boolean = false;
    
    private keyboardNavigation: boolean = true;
    private announcements: AnnouncementEntry[] = [];
    private focusManager: FocusManager;
    private settings: AccessibilitySettings;
    private ariaLiveRegion: HTMLElement | null = null;
    private isKeyboardUser: boolean = false;

    constructor(config: any = {}, container: IServiceContainer | null = null) {
        this.config = { ...(window as any).CONFIG, ...config };
        this.container = container;
        
        this.focusManager = {
            currentFocus: null,
            focusableElements: [],
            trapFocus: false
        };
        
        this.settings = {
            keyboardNavigation: this.getConfig('ACCESSIBILITY.KEYBOARD_NAVIGATION', true),
            screenReaderSupport: this.getConfig('ACCESSIBILITY.SCREEN_READER_SUPPORT', false),
            announcements: this.getConfig('ACCESSIBILITY.ANNOUNCEMENTS', true),
            focusTrapping: this.getConfig('ACCESSIBILITY.FOCUS_TRAPPING', false),
            ariaSupport: this.getConfig('ACCESSIBILITY.ARIA_SUPPORT', true)
        };

        console.log('🛡️ AccessibilityManager initialized');
    }

    /**
     * シングルトンインスタンス取得
     */
    static getInstance(config?: any, container?: IServiceContainer): AccessibilityManager {
        if (!AccessibilityManager.instance) {
            AccessibilityManager.instance = new AccessibilityManager(config, container);
        }
        return AccessibilityManager.instance;
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
        this.setupKeyboardNavigation();
        this.setupAriaLiveRegion();
        this.setupEventListeners();
        this.log('AccessibilityManager initialization completed', 'info');
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
     * キーボードナビゲーション設定
     */
    private setupKeyboardNavigation(): void {
        if (!this.settings.keyboardNavigation) return;

        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
        
        this.updateFocusableElements();
    }

    /**
     * ARIA Live領域の設定
     */
    private setupAriaLiveRegion(): void {
        if (!this.settings.ariaSupport) return;

        this.ariaLiveRegion = document.createElement('div');
        this.ariaLiveRegion.setAttribute('aria-live', 'polite');
        this.ariaLiveRegion.setAttribute('aria-atomic', 'true');
        this.ariaLiveRegion.className = 'sr-only';
        this.ariaLiveRegion.style.cssText = `
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
        `;
        
        document.body.appendChild(this.ariaLiveRegion);
    }

    /**
     * イベントリスナー設定
     */
    private setupEventListeners(): void {
        // リサイズ時にフォーカス可能要素を更新
        window.addEventListener('resize', () => {
            this.updateFocusableElements();
        });
    }

    /**
     * アナウンス
     */
    announce(message: string, level: AnnounceLevel = 'polite'): void {
        if (!this.settings.announcements) return;

        const entry: AnnouncementEntry = {
            message,
            priority: level,
            timestamp: Date.now()
        };
        
        this.announcements.push(entry);
        this.log(`Announce [${level}]: ${message}`, 'debug');
        
        // ARIA Live領域に出力
        if (this.ariaLiveRegion && level !== 'off') {
            this.ariaLiveRegion.textContent = message;
            
            // 一定時間後にクリア
            setTimeout(() => {
                if (this.ariaLiveRegion) {
                    this.ariaLiveRegion.textContent = '';
                }
            }, this.getConfig('ACCESSIBILITY.ANNOUNCEMENT_DELAY', 1000));
        }
        
        // キューのクリーンアップ
        if (this.announcements.length > 50) {
            this.announcements = this.announcements.slice(-25);
        }
    }

    /**
     * フォーカス処理
     */
    focus(element: HTMLElement | null): void {
        if (!element) return;
        
        try {
            element.focus();
            this.focusManager.currentFocus = element;
            this.announce(`フォーカス: ${this.getElementDescription(element)}`, 'polite');
        } catch (error) {
            this.log('Focus error', 'warn', error);
        }
    }

    /**
     * フォーカス可能要素の更新
     */
    private updateFocusableElements(): void {
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]'
        ];

        this.focusManager.focusableElements = Array.from(
            document.querySelectorAll(focusableSelectors.join(','))
        ) as HTMLElement[];
    }

    /**
     * 要素の説明文を取得
     */
    private getElementDescription(element: HTMLElement): string {
        return element.getAttribute('aria-label') ||
               element.getAttribute('title') ||
               element.textContent?.trim() ||
               element.tagName.toLowerCase();
    }

    /**
     * キーボードイベント処理
     */
    private handleKeyDown(event: KeyboardEvent): void {
        this.isKeyboardUser = true;
        
        // Tab ナビゲーション
        if (event.key === 'Tab') {
            this.handleTabNavigation(event);
        }
        
        // Escape キー
        if (event.key === 'Escape') {
            this.handleEscapeKey(event);
        }
    }

    /**
     * マウスイベント処理
     */
    private handleMouseDown(): void {
        this.isKeyboardUser = false;
    }

    /**
     * フォーカスインイベント処理
     */
    private handleFocusIn(event: FocusEvent): void {
        this.focusManager.currentFocus = event.target as HTMLElement;
    }

    /**
     * Tab ナビゲーション処理
     */
    private handleTabNavigation(event: KeyboardEvent): void {
        if (!this.settings.focusTrapping || !this.focusManager.trapFocus) return;
        
        const { focusableElements } = this.focusManager;
        if (focusableElements.length === 0) return;
        
        const currentIndex = focusableElements.indexOf(this.focusManager.currentFocus!);
        let nextIndex: number;
        
        if (event.shiftKey) {
            nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        } else {
            nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
        }
        
        event.preventDefault();
        this.focus(focusableElements[nextIndex]);
    }

    /**
     * Escape キー処理
     */
    private handleEscapeKey(event: KeyboardEvent): void {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
            activeElement.blur();
            this.announce('フォーカスを解除しました', 'polite');
        }
    }

    /**
     * ARIA 属性更新
     */
    updateAriaLabels(): void {
        if (!this.settings.ariaSupport) return;
        
        // 基本的なARIA属性を自動設定
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach((button) => {
            if (!button.textContent?.trim()) {
                button.setAttribute('aria-label', 'ボタン');
            }
        });
        
        const inputs = document.querySelectorAll('input:not([aria-label])');
        inputs.forEach((input) => {
            const type = input.getAttribute('type') || 'text';
            input.setAttribute('aria-label', `${type} 入力欄`);
        });
    }

    /**
     * フォーカストラップの有効/無効
     */
    setFocusTrapping(enabled: boolean): void {
        this.focusManager.trapFocus = enabled;
        this.log(`Focus trapping ${enabled ? 'enabled' : 'disabled'}`, 'debug');
    }

    /**
     * 有効状態チェック
     */
    isEnabled(): boolean {
        return this.settings.keyboardNavigation || this.settings.screenReaderSupport;
    }

    /**
     * 設定更新
     */
    updateSettings(newSettings: Partial<AccessibilitySettings>): void {
        this.settings = { ...this.settings, ...newSettings };
        this.log('Settings updated', 'info', this.settings);
    }

    /**
     * クリーンアップ
     */
    destroy(): void {
        try {
            // イベントリスナーの削除
            document.removeEventListener('keydown', this.handleKeyDown.bind(this));
            document.removeEventListener('mousedown', this.handleMouseDown.bind(this));
            document.removeEventListener('focusin', this.handleFocusIn.bind(this));
            
            // ARIA Live領域の削除
            if (this.ariaLiveRegion && this.ariaLiveRegion.parentNode) {
                this.ariaLiveRegion.parentNode.removeChild(this.ariaLiveRegion);
            }
            
            // データのクリーンアップ
            this.announcements = [];
            this.focusManager.focusableElements = [];
            this.isInitialized = false;
            
            this.log('Manager destroyed', 'info');
        } catch (error) {
            this.log('Error during cleanup', 'error', error);
        }
    }
}

// グローバル参照を設定
(window as any).AccessibilityManager = AccessibilityManager;

export default AccessibilityManager;