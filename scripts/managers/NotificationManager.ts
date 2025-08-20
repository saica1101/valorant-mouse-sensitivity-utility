/**
 * Notification Manager - TypeScript版
 * 通知管理クラス
 */

// 型定義
type NotificationType = 'success' | 'error' | 'info' | 'warning';
type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

interface NotificationOptions {
    duration?: number;
    closable?: boolean;
    position?: NotificationPosition;
    animation?: boolean;
    priority?: number;
}

interface NotificationInfo {
    id: string;
    message: string;
    type: NotificationType;
    timestamp: number;
    options: NotificationOptions;
    element: HTMLElement;
}

interface AutoHideDelayConfig {
    success: number;
    error: number;
    info: number;
    warning: number;
}

interface IServiceContainer {
    register<T>(name: string, factory: any, singleton?: boolean): IServiceContainer;
    get<T>(name: string): T;
    has(name: string): boolean;
    resolve(dependencies: Record<string, string>): Record<string, any>;
    initializeAll(serviceNames: string[]): Promise<void>;
    getRegisteredServices(): string[];
}

interface NotificationAppConfig {
    UI?: {
        SUCCESS_DISPLAY_DURATION?: number;
        ERROR_DISPLAY_DURATION?: number;
        WARNING_DISPLAY_DURATION?: number;
        INFO_DISPLAY_DURATION?: number;
    };
}

class NotificationManager extends BaseManager {
    private notifications = new Map<string, NotificationInfo>();
    private notificationContainer: HTMLElement | null = null;
    private queue: NotificationInfo[] = [];
    private maxNotifications: number = 5;
    private autoHideDelay: AutoHideDelayConfig;
    private notificationId: number = 0;

    constructor(config: any = {}, container: IServiceContainer | null = null) {
        super(config, container);
        
        this.autoHideDelay = {
            success: this.getConfig<number>('UI.SUCCESS_DISPLAY_DURATION', 2000),
            error: this.getConfig<number>('UI.ERROR_DISPLAY_DURATION', 3000),
            info: 3000,
            warning: 4000
        };
    }

    /**
     * 初期化処理
     */
    protected async doInit(): Promise<void> {
        this.createNotificationContainer();
        this.setupNotificationStyles();
        this.log('Notification manager initialized', 'info');
    }

    /**
     * 通知コンテナの作成
     */
    private createNotificationContainer(): void {
        this.notificationContainer = document.getElementById('notificationContainer');
        
        if (!this.notificationContainer) {
            this.notificationContainer = document.createElement('div');
            this.notificationContainer.id = 'notificationContainer';
            this.notificationContainer.className = 'notification-container';
            this.notificationContainer.setAttribute('role', 'alert');
            this.notificationContainer.setAttribute('aria-live', 'polite');
            document.body.appendChild(this.notificationContainer);
        }

        this.log('NotificationContainer created', 'debug');
    }

    /**
     * 通知スタイルの設定
     */
    private setupNotificationStyles(): void {
        if (document.getElementById('notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            }
            
            .notification {
                background: var(--background-color, #2d2d2d);
                color: var(--text-color, #ffffff);
                border-radius: 8px;
                padding: 12px 16px;
                margin-bottom: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                border-left: 4px solid #ccc;
                display: flex;
                align-items: center;
                min-width: 300px;
                max-width: 400px;
                pointer-events: auto;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            }
            
            .notification.show {
                opacity: 1;
                transform: translateX(0);
            }
            
            .notification.success {
                border-left-color: #22c55e;
                background: var(--success-bg, #1a4d2e);
                color: var(--success-text, #ffffff);
            }
            
            .notification.error {
                border-left-color: #ef4444;
                background: var(--error-bg, #4a1d1d);
                color: var(--error-text, #ffffff);
            }
            
            .notification.warning {
                border-left-color: #f59e0b;
                background: var(--warning-bg, #4a3718);
                color: var(--warning-text, #ffffff);
            }
            
            .notification.info {
                border-left-color: #3b82f6;
                background: var(--info-bg, #1e3a5f);
                color: var(--info-text, #ffffff);
            }
            
            .notification-icon {
                margin-right: 8px;
                font-size: 16px;
                flex-shrink: 0;
            }
            
            .notification-content {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 16px;
                cursor: pointer;
                padding: 0;
                margin-left: 8px;
                opacity: 0.6;
                flex-shrink: 0;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            @media (max-width: 480px) {
                .notification-container {
                    left: 20px;
                    right: 20px;
                    top: 20px;
                }
                
                .notification {
                    min-width: auto;
                    max-width: none;
                }
            }
        `;
        
        document.head.appendChild(style);
        this.log('Notification styles added', 'debug');
    }

    /**
     * 通知を表示
     */
    public show(
        message: string, 
        type: NotificationType = 'info', 
        options: NotificationOptions = {}
    ): string {
        const notification = this.createNotification(message, type, options);
        
        if (this.notifications.size >= this.maxNotifications) {
            this.queue.push(notification);
            this.log('Notification queued (max limit reached)', 'debug');
            return notification.id;
        }
        
        this.displayNotification(notification);
        return notification.id;
    }

    /**
     * 通知オブジェクトの作成
     */
    private createNotification(
        message: string, 
        type: NotificationType, 
        options: NotificationOptions
    ): NotificationInfo {
        const id = `notification-${++this.notificationId}`;
        const timestamp = Date.now();
        
        const finalOptions: NotificationOptions = {
            duration: this.autoHideDelay[type],
            closable: true,
            position: 'top-right',
            animation: true,
            priority: 0,
            ...options
        };

        const element = this.createElement(message, type, finalOptions, id);
        
        return {
            id,
            message,
            type,
            timestamp,
            options: finalOptions,
            element
        };
    }

    /**
     * 通知DOM要素の作成
     */
    private createElement(
        message: string, 
        type: NotificationType, 
        options: NotificationOptions, 
        id: string
    ): HTMLElement {
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification ${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');

        const iconMap: Record<NotificationType, string> = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <span class="notification-icon">${iconMap[type]}</span>
            <div class="notification-content">${this.escapeHtml(message)}</div>
            ${options.closable ? '<button class="notification-close" aria-label="Close">×</button>' : ''}
        `;

        // クローズボタンのイベント
        if (options.closable) {
            const closeBtn = notification.querySelector('.notification-close') as HTMLButtonElement;
            closeBtn?.addEventListener('click', () => this.hide(id));
        }

        return notification;
    }

    /**
     * 通知の表示
     */
    private displayNotification(notification: NotificationInfo): void {
        if (!this.notificationContainer) {
            this.log('Notification container not found', 'error');
            return;
        }

        this.notifications.set(notification.id, notification);
        this.notificationContainer.appendChild(notification.element);

        // アニメーション
        requestAnimationFrame(() => {
            notification.element.classList.add('show');
        });

        // 自動非表示
        if (notification.options.duration && notification.options.duration > 0) {
            setTimeout(() => {
                this.hide(notification.id);
            }, notification.options.duration);
        }

        this.log(`Notification displayed: ${notification.id}`, 'debug');
    }

    /**
     * 通知を非表示
     */
    public hide(id: string): void {
        const notification = this.notifications.get(id);
        if (!notification) {
            this.log(`Notification not found: ${id}`, 'warn');
            return;
        }

        notification.element.classList.remove('show');
        
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.delete(id);
            this.processQueue();
        }, 300); // アニメーション時間

        this.log(`Notification hidden: ${id}`, 'debug');
    }

    /**
     * キューの処理
     */
    private processQueue(): void {
        if (this.queue.length > 0 && this.notifications.size < this.maxNotifications) {
            const nextNotification = this.queue.shift();
            if (nextNotification) {
                this.displayNotification(nextNotification);
            }
        }
    }

    /**
     * 全通知をクリア
     */
    public clear(): void {
        const ids = Array.from(this.notifications.keys());
        ids.forEach(id => this.hide(id));
        this.queue = [];
        this.log('All notifications cleared', 'info');
    }

    /**
     * アクティブな通知一覧を取得
     */
    public getActiveNotifications(): NotificationInfo[] {
        return Array.from(this.notifications.values());
    }

    /**
     * 通知数の制限を設定
     */
    public setMaxNotifications(max: number): void {
        this.maxNotifications = Math.max(1, max);
        this.log(`Max notifications set to: ${this.maxNotifications}`, 'debug');
    }

    /**
     * 自動非表示時間の設定
     */
    public setAutoHideDelay(type: NotificationType, delay: number): void {
        this.autoHideDelay[type] = Math.max(0, delay);
        this.log(`Auto hide delay for ${type} set to: ${delay}ms`, 'debug');
    }

    /**
     * HTMLエスケープ
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 通知のタイプ別表示
     */
    public success(message: string, options?: NotificationOptions): string {
        return this.show(message, 'success', options);
    }

    public error(message: string, options?: NotificationOptions): string {
        return this.show(message, 'error', options);
    }

    public warning(message: string, options?: NotificationOptions): string {
        return this.show(message, 'warning', options);
    }

    public info(message: string, options?: NotificationOptions): string {
        return this.show(message, 'info', options);
    }

    /**
     * クリーンアップ処理
     */
    public destroy(): void {
        this.clear();
        
        // スタイルシートの削除
        const styles = document.getElementById('notification-styles');
        if (styles) {
            styles.remove();
        }
        
        // コンテナの削除
        if (this.notificationContainer && this.notificationContainer.parentNode) {
            this.notificationContainer.parentNode.removeChild(this.notificationContainer);
            this.notificationContainer = null;
        }

        super.destroy();
        this.log('NotificationManager destroyed', 'info');
    }
}

// Export for both ES6 modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationManager };
} else if (typeof window !== 'undefined') {
    (window as any).NotificationManager = NotificationManager;
}
