/**
 * Accessibility Manager
 * アクセシビリティマネージャー
 */

class AccessibilityManager {
    constructor() {
        this.focusableElements = [];
        this.currentFocusIndex = 0;
        this.isKeyboardUser = false;
        this.announcements = [];
        
        this.init();
    }
    
    /**
     * アクセシビリティシステムの初期化
     */
    init() {
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupScreenReaderSupport();
        this.setupHighContrastSupport();
    }
    
    /**
     * キーボードナビゲーションのセットアップ
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            this.isKeyboardUser = true;
            
            switch (event.key) {
                case 'Tab':
                    this.handleTabNavigation(event);
                    break;
                case 'Enter':
                case ' ':
                    this.handleActivation(event);
                    break;
                case 'Escape':
                    this.handleEscape(event);
                    break;
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    this.handleArrowNavigation(event);
                    break;
            }
        });
        
        // マウス使用の検出
        document.addEventListener('mousedown', () => {
            this.isKeyboardUser = false;
        });
    }
    
    /**
     * フォーカス管理のセットアップ
     */
    setupFocusManagement() {
        // フォーカス可能な要素を定期的に更新
        this.updateFocusableElements();
        
        // DOM変更を監視
        const observer = new MutationObserver(() => {
            this.updateFocusableElements();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['tabindex', 'disabled', 'aria-hidden']
        });
        
        // フォーカス表示の改善
        document.addEventListener('focusin', (event) => {
            if (this.isKeyboardUser) {
                event.target.classList.add('keyboard-focus');
            }
        });
        
        document.addEventListener('focusout', (event) => {
            event.target.classList.remove('keyboard-focus');
        });
    }
    
    /**
     * フォーカス可能な要素を更新
     */
    updateFocusableElements() {
        const selector = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])'
        ].join(',');
        
        this.focusableElements = Array.from(document.querySelectorAll(selector))
            .filter(el => !el.hasAttribute('aria-hidden') && this.isVisible(el));
    }
    
    /**
     * 要素が可視かどうか判定
     */
    isVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0';
    }
    
    /**
     * タブナビゲーションの処理
     */
    handleTabNavigation(event) {
        if (this.focusableElements.length === 0) return;
        
        const currentIndex = this.focusableElements.indexOf(document.activeElement);
        let nextIndex;
        
        if (event.shiftKey) {
            // Shift+Tab: 前の要素
            nextIndex = currentIndex <= 0 ? this.focusableElements.length - 1 : currentIndex - 1;
        } else {
            // Tab: 次の要素
            nextIndex = currentIndex >= this.focusableElements.length - 1 ? 0 : currentIndex + 1;
        }
        
        if (this.focusableElements[nextIndex]) {
            event.preventDefault();
            this.focusableElements[nextIndex].focus();
        }
    }
    
    /**
     * アクティベーション（Enter/Space）の処理
     */
    handleActivation(event) {
        const target = event.target;
        
        if (target.tagName === 'BUTTON' || target.role === 'button') {
            event.preventDefault();
            target.click();
        }
    }
    
    /**
     * Escapeキーの処理
     */
    handleEscape(event) {
        // モーダルやドロップダウンを閉じる
        const modal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])');
        if (modal) {
            event.preventDefault();
            this.closeModal(modal);
        }
        
        // 戻るボタンがある場合は実行
        const backButton = document.getElementById('backBtn');
        if (backButton && !backButton.classList.contains('hidden')) {
            event.preventDefault();
            backButton.click();
        }
    }
    
    /**
     * 矢印キーナビゲーションの処理
     */
    handleArrowNavigation(event) {
        const target = event.target;
        const parent = target.closest('[role="radiogroup"], [role="tablist"], .dpi-buttons');
        
        if (parent) {
            event.preventDefault();
            const siblings = Array.from(parent.querySelectorAll('[role="radio"], [role="tab"], .dpi-btn'));
            const currentIndex = siblings.indexOf(target);
            let nextIndex;
            
            switch (event.key) {
                case 'ArrowUp':
                case 'ArrowLeft':
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : siblings.length - 1;
                    break;
                case 'ArrowDown':
                case 'ArrowRight':
                    nextIndex = currentIndex < siblings.length - 1 ? currentIndex + 1 : 0;
                    break;
            }
            
            if (siblings[nextIndex]) {
                siblings[nextIndex].focus();
                if (siblings[nextIndex].click) {
                    siblings[nextIndex].click();
                }
            }
        }
    }
    
    /**
     * スクリーンリーダーサポートのセットアップ
     */
    setupScreenReaderSupport() {
        // ライブリージョンの作成
        this.createLiveRegion();
        
        // 動的コンテンツの変更を通知
        this.setupContentChangeAnnouncements();
    }
    
    /**
     * ライブリージョンの作成
     */
    createLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(liveRegion);
        
        this.liveRegion = liveRegion;
    }
    
    /**
     * スクリーンリーダーに通知
     */
    announce(message, priority = 'polite') {
        if (!this.liveRegion) return;
        
        this.liveRegion.setAttribute('aria-live', priority);
        this.liveRegion.textContent = message;
        
        // 同じメッセージの場合は一旦クリアしてから設定
        setTimeout(() => {
            this.liveRegion.textContent = '';
        }, 1000);
    }
    
    /**
     * コンテンツ変更通知のセットアップ
     */
    setupContentChangeAnnouncements() {
        // フェーズ変更の監視
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.id && (target.id.includes('Phase') || target.id.includes('phase'))) {
                        if (!target.classList.contains('hidden')) {
                            this.announcePhaseChange(target);
                        }
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ['class']
        });
    }
    
    /**
     * フェーズ変更の通知
     */
    announcePhaseChange(element) {
        let message = '';
        
        switch (element.id) {
            case 'setupPhase':
                message = window.I18N?.t('steps.step1') || 'DPI設定フェーズ';
                break;
            case 'adjustmentPhase':
                message = window.I18N?.t('adjustment.question') || '感度調整フェーズ';
                break;
            case 'finishPhase':
                message = window.I18N?.t('result.title') || '結果表示フェーズ';
                break;
        }
        
        if (message) {
            this.announce(message);
        }
    }
    
    /**
     * ハイコントラストサポートのセットアップ
     */
    setupHighContrastSupport() {
        // システムのハイコントラスト設定を検出
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.documentElement.classList.add('high-contrast');
        }
        
        // ハイコントラストモード切り替え
        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            if (e.matches) {
                document.documentElement.classList.add('high-contrast');
            } else {
                document.documentElement.classList.remove('high-contrast');
            }
        });
    }
    
    /**
     * ハイコントラストセットアップ（エイリアスメソッド）
     */
    setupHighContrast() {
        return this.setupHighContrastSupport();
    }
    
    /**
     * ライブリージョンのセットアップ
     */
    setupLiveRegions() {
        // メイン通知エリア
        const notificationContainer = document.getElementById('notificationContainer');
        if (notificationContainer) {
            notificationContainer.setAttribute('aria-live', 'polite');
            notificationContainer.setAttribute('aria-atomic', 'true');
        }
        
        // 動的コンテンツエリア
        const dynamicElements = [
            'version',
            'leftCandidate',
            'rightCandidate',
            'finalSensitivity',
            'lowerBound',
            'upperBound'
        ];
        
        dynamicElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.setAttribute('aria-live', 'polite');
            }
        });
    }
    
    /**
     * ARIA ラベルの追加
     */
    addAriaLabel(element, label) {
        if (element && label) {
            element.setAttribute('aria-label', label);
        }
    }
    
    /**
     * ARIA属性の設定
     */
    setAriaAttributes(element, attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
            if (key.startsWith('aria-') || key === 'role') {
                element.setAttribute(key, value);
            }
        });
    }
    
    /**
     * フォーカストラップの設定
     */
    setupFocusTrap(container) {
        const focusable = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];
        
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });
        
        // 初期フォーカス
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }
}

// ES6モジュールとしてもCommonJSとしても使用可能
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityManager;
} else {
    window.AccessibilityManager = AccessibilityManager;
}
