/**
 * Performance Manager
 * パフォーマンス最適化マネージャー
 */

class PerformanceManager {
    constructor() {
        this.cache = new Map();
        this.observers = new Map();
        this.timers = new Map();
        this.metrics = {
            renderTime: [],
            memoryUsage: [],
            eventProcessingTime: []
        };
        
        this.init();
    }
    
    /**
     * パフォーマンス最適化システムの初期化
     */
    init() {
        this.setupRenderOptimization();
        this.setupMemoryManagement();
        this.setupEventOptimization();
        this.setupPerformanceMonitoring();
    }
    
    /**
     * レンダリング最適化のセットアップ
     */
    setupRenderOptimization() {
        // バーチャルスクロール（必要に応じて）
        this.setupVirtualScrolling();
        
        // 遅延読み込み
        this.setupLazyLoading();
        
        // レンダリングバッチング
        this.setupRenderBatching();
    }
    
    /**
     * バーチャルスクロールのセットアップ
     */
    setupVirtualScrolling() {
        // 現在のアプリではリスト表示が少ないため、基本的な最適化のみ
        const intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadElement(entry.target);
                } else {
                    this.unloadElement(entry.target);
                }
            });
        }, {
            rootMargin: '50px'
        });
        
        this.intersectionObserver = intersectionObserver;
    }
    
    /**
     * 遅延読み込みのセットアップ
     */
    setupLazyLoading() {
        // 画像の遅延読み込み
        document.addEventListener('DOMContentLoaded', () => {
            const lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(img => {
                this.intersectionObserver.observe(img);
            });
        });
    }
    
    /**
     * レンダリングバッチングのセットアップ
     */
    setupRenderBatching() {
        this.renderQueue = [];
        this.isRenderScheduled = false;
        
        // レンダリングキューの処理
        this.processRenderQueue = () => {
            if (this.renderQueue.length > 0) {
                const startTime = performance.now();
                
                // バッチ処理
                const batch = this.renderQueue.splice(0, 10); // 一度に10個まで処理
                batch.forEach(renderFunction => {
                    try {
                        renderFunction();
                    } catch (error) {
                        // Render error
                    }
                });
                
                const endTime = performance.now();
                this.recordMetric('renderTime', endTime - startTime);
                
                // 残りがあれば次のフレームで継続
                if (this.renderQueue.length > 0) {
                    requestAnimationFrame(this.processRenderQueue);
                } else {
                    this.isRenderScheduled = false;
                }
            } else {
                this.isRenderScheduled = false;
            }
        };
    }
    
    /**
     * レンダリングをキューに追加
     */
    queueRender(renderFunction) {
        this.renderQueue.push(renderFunction);
        
        if (!this.isRenderScheduled) {
            this.isRenderScheduled = true;
            requestAnimationFrame(this.processRenderQueue);
        }
    }
    
    /**
     * メモリ管理のセットアップ
     */
    setupMemoryManagement() {
        // キャッシュサイズの制限
        this.maxCacheSize = window.CONFIG?.PERFORMANCE?.CACHE_SIZE || 50;
        
        // 開発環境でのみ定期的なガベージコレクション
        if (process.env.NODE_ENV === 'development') {
            setInterval(() => {
                this.cleanupCache();
                this.recordMemoryUsage();
            }, 60000); // 60秒ごとに変更
        } else {
            // 本番環境では手動クリーンアップのみ
            setInterval(() => {
                this.cleanupCache();
            }, 120000); // 2分ごと
        }
        
        // ページ非表示時のクリーンアップ
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.performDeepCleanup();
            }
        });
    }
    
    /**
     * DOM要素のキャッシュ
     * @param {string[]} elementIds - キャッシュする要素のIDリスト
     * @returns {Object} キャッシュされた要素のオブジェクト
     */
    cacheElements(elementIds) {
        const elements = {};
        
        elementIds.forEach(id => {
            if (!this.cache.has(`element_${id}`)) {
                const element = document.getElementById(id);
                if (element) {
                    this.cache.set(`element_${id}`, element);
                }
            }
            elements[id] = this.cache.get(`element_${id}`);
        });
        
        return elements;
    }
    
    /**
     * キャッシュのクリーンアップ
     */
    cleanupCache() {
        if (this.cache.size > this.maxCacheSize) {
            const entries = Array.from(this.cache.entries());
            const entriesToDelete = entries.slice(0, entries.length - this.maxCacheSize);
            
            entriesToDelete.forEach(([key]) => {
                this.cache.delete(key);
            });
        }
    }
    
    /**
     * ディープクリーンアップ
     */
    performDeepCleanup() {
        // 不要なDOM要素の削除
        document.querySelectorAll('.notification.hidden').forEach(el => {
            el.remove();
        });
        
        // タイマーのクリア
        this.timers.forEach((timer, key) => {
            clearTimeout(timer);
            this.timers.delete(key);
        });
        
        // キャッシュの一部クリア
        if (this.cache.size > 10) {
            const entries = Array.from(this.cache.entries());
            const keepEntries = entries.slice(-10);
            this.cache.clear();
            keepEntries.forEach(([key, value]) => {
                this.cache.set(key, value);
            });
        }
    }
    
    /**
     * イベント最適化の実行
     */
    optimizeEvents() {
        // パッシブリスナーの設定
        this.setupPassiveListeners();
        
        // 不要なイベントの削除
        this.removeUnusedEventListeners();
        
        // イベント最適化が完了しました
    }
    
    /**
     * パッシブリスナーのセットアップ
     */
    setupPassiveListeners() {
        // タッチイベントとスクロールイベントをパッシブに設定
        const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'scroll'];
        
        passiveEvents.forEach(eventType => {
            document.addEventListener(eventType, () => {}, { passive: true });
        });
    }
    
    /**
     * 未使用のイベントリスナーの削除
     */
    removeUnusedEventListeners() {
        // 現在のアプリケーションでは基本的な処理のみ
        // 必要に応じて拡張
    }
    
    /**
     * イベント最適化のセットアップ
     */
    setupEventOptimization() {
        this.setupDebounce();
        this.setupThrottle();
        this.setupEventDelegation();
    }
    
    /**
     * デバウンス機能のセットアップ
     */
    setupDebounce() {
        this.debounce = (func, delay = 300) => {
            let timeoutId;
            return (...args) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        };
    }
    
    /**
     * スロットル機能のセットアップ
     */
    setupThrottle() {
        this.throttle = (func, delay = 100) => {
            let isThrottled = false;
            return (...args) => {
                if (!isThrottled) {
                    func.apply(this, args);
                    isThrottled = true;
                    setTimeout(() => {
                        isThrottled = false;
                    }, delay);
                }
            };
        };
    }
    
    /**
     * イベント委譲のセットアップ
     */
    setupEventDelegation() {
        // ボタンクリックの委譲
        document.addEventListener('click', (event) => {
            const startTime = performance.now();
            
            // DPIボタンの処理
            if (event.target.classList.contains('dpi-btn')) {
                this.handleDPIButtonClick(event);
            }
            
            // 通知の閉じるボタンの処理
            if (event.target.classList.contains('notification-close')) {
                this.handleNotificationClose(event);
            }
            
            const endTime = performance.now();
            this.recordMetric('eventProcessingTime', endTime - startTime);
        });
    }
    
    /**
     * DPIボタンクリックの最適化された処理
     */
    handleDPIButtonClick(event) {
        const button = event.target;
        const dpiValue = button.dataset.dpi;
        
        // キャッシュされた処理を使用
        const cacheKey = `dpi-${dpiValue}`;
        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, {
                value: dpiValue,
                timestamp: Date.now()
            });
        }
        
        // バッチレンダリングに追加
        this.queueRender(() => {
            document.querySelectorAll('.dpi-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            });
            
            button.classList.add('active');
            button.setAttribute('aria-pressed', 'true');
            
            const dpiInput = document.getElementById('dpiInput');
            if (dpiInput) {
                dpiInput.value = dpiValue;
            }
        });
    }
    
    /**
     * 通知を閉じる処理
     */
    handleNotificationClose(event) {
        const notification = event.target.closest('.notification');
        if (notification) {
            this.queueRender(() => {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            });
        }
    }
    
    /**
     * パフォーマンス監視のセットアップ
     */
    setupPerformanceMonitoring() {
        // 開発環境でのみパフォーマンス監視を有効化
        if (process.env.NODE_ENV === 'development') {
            // パフォーマンスメトリクスの収集
            if ('performance' in window) {
                this.setupPerformanceObserver();
            }
            
            // メモリ使用量の監視
            this.setupMemoryMonitoring();
            
            // FPSの監視
            this.setupFPSMonitoring();
        }
    }
    
    /**
     * パフォーマンスオブザーバーのセットアップ
     */
    setupPerformanceObserver() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.entryType === 'measure') {
                        this.recordMetric('customMeasures', entry.duration);
                    }
                });
            });
            
            observer.observe({ entryTypes: ['measure', 'navigation'] });
            this.performanceObserver = observer;
        } catch (error) {
            // PerformanceObserver not supported
        }
    }
    
    /**
     * メモリ監視のセットアップ
     */
    setupMemoryMonitoring() {
        // 開発環境でのみメモリ監視を有効化
        if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
            this.recordMemoryUsage();
            
            // 30秒間隔でメモリ監視（本番では無効）
            setInterval(() => {
                this.recordMemoryUsage();
            }, 30000);
        }
    }
    
    /**
     * FPS監視のセットアップ
     */
    setupFPSMonitoring() {
        // 開発環境でのみFPS監視を有効化（本番では無効）
        if (process.env.NODE_ENV === 'development') {
            let lastTime = performance.now();
            let frameCount = 0;
            
            const measureFPS = (currentTime) => {
                frameCount++;
                
                if (currentTime - lastTime >= 5000) { // 5秒間隔に変更
                    const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                    this.recordMetric('fps', fps);
                    
                    frameCount = 0;
                    lastTime = currentTime;
                }
                
                // 条件付きで継続
                if (frameCount < 300) { // 300フレーム後に停止
                    requestAnimationFrame(measureFPS);
                }
            };
            
            requestAnimationFrame(measureFPS);
        }
    }
    
    /**
     * メトリクスの記録
     */
    recordMetric(type, value) {
        if (!this.metrics[type]) {
            this.metrics[type] = [];
        }
        
        this.metrics[type].push({
            value,
            timestamp: Date.now()
        });
        
        // メトリクスの履歴を制限
        if (this.metrics[type].length > 100) {
            this.metrics[type].shift();
        }
    }
    
    /**
     * メモリ使用量の記録
     */
    recordMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            this.recordMetric('memoryUsage', {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit
            });
        }
    }
    
    /**
     * パフォーマンス統計の取得
     */
    getPerformanceStats() {
        const stats = {};
        
        Object.entries(this.metrics).forEach(([type, values]) => {
            if (values.length > 0) {
                const numericValues = values.map(v => 
                    typeof v.value === 'number' ? v.value : 
                    typeof v.value === 'object' ? v.value.used : 0
                );
                
                stats[type] = {
                    avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
                    min: Math.min(...numericValues),
                    max: Math.max(...numericValues),
                    count: values.length
                };
            }
        });
        
        return stats;
    }
    
    /**
     * 最適化された要素作成
     */
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // 属性の一括設定
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.assign(element.dataset, value);
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // 子要素の追加
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        
        return element;
    }
    
    /**
     * リソースの解放
     */
    dispose() {
        // オブザーバーの停止
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        
        // タイマーのクリア
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
        
        // キャッシュのクリア
        this.cache.clear();
        
        // メトリクスのクリア
        Object.keys(this.metrics).forEach(key => {
            this.metrics[key] = [];
        });
    }
}

// ES6モジュールとしてもCommonJSとしても使用可能
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceManager;
} else {
    window.PerformanceManager = PerformanceManager;
}
