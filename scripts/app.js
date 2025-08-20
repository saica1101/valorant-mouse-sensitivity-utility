/**
 * Valorant Mouse Sensitivity Utility - Ternary Search Algorithm
 * マウス感度調整アプリケーション - 三分探索アルゴリズム
 */

class MouseSensitivityUtility {
    constructor() {
        // 設定を外部化
        this.config = window.CONFIG;
        
        if (!this.config) {
            alert('設定ファイルの読み込みに失敗しました。ページをリロードしてください。');
            return;
        }
        
        // アルゴリズム関連
        this.inputDPI = 0;
        this.lowerBound = 0;
        this.upperBound = 0;
        this.leftThird = 0;  // 三分探索の左側候補
        this.rightThird = 0; // 三分探索の右側候補
        
        this.initializeElements();
        this.bindEvents();
        this.initializeTheme();
        
        // バージョン読み込みを少し遅延させる
        setTimeout(() => {
            this.loadAppVersion();
        }, 100);
    }

    /**
     * DOM要素の初期化
     */
    initializeElements() {
        this.dpiInput = document.getElementById('dpiInput');
        this.dpiButtons = document.querySelectorAll('.dpi-btn');
        this.startBtn = document.getElementById('startBtn');
        this.leftBtn = document.getElementById('leftBtn');
        this.rightBtn = document.getElementById('rightBtn');
        this.equalBtn = document.getElementById('equalBtn');
        this.backBtn = document.getElementById('backBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.versionElement = document.getElementById('version');
        this.notificationContainer = document.getElementById('notificationContainer');
        
        this.setupPhase = document.getElementById('setupPhase');
        this.backPhase = document.getElementById('backPhase');
        this.adjustmentPhase = document.getElementById('adjustmentPhase');
        this.finishPhase = document.getElementById('finishPhase');
        
        this.leftCandidate = document.getElementById('leftCandidate');
        this.rightCandidate = document.getElementById('rightCandidate');
        this.finalSensitivity = document.getElementById('finalSensitivity');
        this.lowerBoundDisplay = document.getElementById('lowerBound');
        this.upperBoundDisplay = document.getElementById('upperBound');
    }

    /**
     * イベントリスナーのバインド
     */
    bindEvents() {
        this.dpiButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectDPI(btn));
        });

        this.dpiInput.addEventListener('input', () => {
            this.dpiButtons.forEach(btn => btn.classList.remove('active'));
        });

        this.startBtn.addEventListener('click', () => this.startAdjustment());
        this.leftBtn.addEventListener('click', () => this.ternaryChoice('left'));
        this.rightBtn.addEventListener('click', () => this.ternaryChoice('right'));
        this.equalBtn.addEventListener('click', () => this.ternaryChoice('equal'));
        this.backBtn.addEventListener('click', () => this.reset());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    /**
     * テーマの初期化
     */
    initializeTheme() {
        const savedTheme = localStorage.getItem(this.config.THEME.STORAGE_KEY) || this.config.THEME.DEFAULT;
        this.setTheme(savedTheme);
    }

    /**
     * テーマの切り替え
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * テーマの設定
     * @param {string} theme - 'light' または 'dark'
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.config.THEME.STORAGE_KEY, theme);
        this.themeToggle.textContent = theme === 'dark' ? '☀️ ライトモード' : '🌙 ダークモード';
    }

    /**
     * アプリケーションバージョンの動的読み込み
     */
    async loadAppVersion() {
        // 最低限のテスト：直接設定
        if (this.versionElement) {
            this.versionElement.textContent = this.config.APP.FALLBACK_VERSION;
        }
        
        try {
            if (window.electronAPI && window.electronAPI.getVersion) {
                const version = await window.electronAPI.getVersion();
                if (this.versionElement) {
                    this.versionElement.textContent = `v${version}`;
                }
            }
        } catch (error) {
            console.warn('バージョン情報の取得に失敗しました:', error);
        }
    }

    /**
     * DPIボタンの選択
     * @param {HTMLElement} button - 選択されたDPIボタン
     */
    selectDPI(button) {
        this.dpiButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.dpiInput.value = button.dataset.dpi;
    }

    /**
     * 通知の表示
     * @param {string} message - 表示するメッセージ
     * @param {string} type - 通知の種類 ('success', 'error', 'info', 'warning')
     * @param {number} duration - 表示時間（ミリ秒）
     */
    showNotification(message, type = 'info', duration = null) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.notificationContainer.appendChild(notification);
        
        // アニメーション用のタイムアウト
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 表示時間の設定
        const displayDuration = duration || 
            (type === 'error' ? this.config.UI.ERROR_DISPLAY_DURATION : this.config.UI.SUCCESS_DISPLAY_DURATION);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, this.config.UI.ANIMATION_DURATION);
        }, displayDuration);
    }

    /**
     * エラー表示
     * @param {string} message - エラーメッセージ
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * 成功表示
     * @param {string} message - 成功メッセージ
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * 感度調整の開始
     */
    startAdjustment() {
        const dpiValue = parseInt(this.dpiInput.value);
        
        if (!this.validateDPIInput(dpiValue)) {
            return;
        }

        try {
            this.inputDPI = dpiValue;
            
            // 仕様に基づく計算
            this.lowerBound = this.config.BASE_SENSI / this.inputDPI;
            this.upperBound = this.lowerBound * this.config.ALGORITHM.RANGE_MULTIPLIER;
            
            // 三分探索の初期化
            this.calculateTernaryPoints();

            this.showSuccess(`感度調整を開始します。DPI: ${dpiValue}`);
            this.showAdjustmentPhase();
            this.updateDisplay();
        } catch (error) {
            this.showError(`調整開始中にエラーが発生しました: ${error.message}`);
        }
    }

    /**
     * DPI入力値の検証
     * @param {number} dpiValue - DPI値
     * @returns {boolean} 検証結果
     */
    validateDPIInput(dpiValue) {
        if (!dpiValue || dpiValue <= 0 || isNaN(dpiValue)) {
            this.showError('正しいDPI値を入力してください（0より大きい数値）');
            return false;
        }
        
        if (dpiValue < this.config.VALIDATION.MIN_DPI || dpiValue > this.config.VALIDATION.MAX_DPI) {
            this.showError(`DPIは${this.config.VALIDATION.MIN_DPI}〜${this.config.VALIDATION.MAX_DPI}の範囲で入力してください`);
            return false;
        }
        
        return true;
    }

    /**
     * 三分探索の分割点を計算
     */
    calculateTernaryPoints() {
        // 三分探索: 範囲を3つに分割して、1/3と2/3の位置を計算
        const range = this.upperBound - this.lowerBound;
        this.leftThird = this.lowerBound + range / 3;
        this.rightThird = this.lowerBound + (2 * range) / 3;
    }

    /**
     * 三分探索の選択処理
     * @param {string} choice - 'left', 'right', または 'equal'
     */
    ternaryChoice(choice) {
        if (choice === 'left') {
            // 左側（小さい値）が好まれる場合：右境界を左候補に移動
            this.upperBound = this.rightThird;
        } else if (choice === 'right') {
            // 右側（大きい値）が好まれる場合：左境界を右候補に移動
            this.lowerBound = this.leftThird;
        } else if (choice === 'equal') {
            // 同じ場合：中間範囲のみを残す（両端を狭める）
            this.lowerBound = this.leftThird;
            this.upperBound = this.rightThird;
        }

        // 新しい三分点を計算
        this.calculateTernaryPoints();

        // 収束判定：範囲が十分小さくなったら終了
        if (Math.abs(this.upperBound - this.lowerBound) < this.config.ALGORITHM.CONVERGENCE_THRESHOLD) {
            this.showFinishPhase();
        } else {
            this.updateDisplay();
        }
    }

    /**
     * 表示の更新
     */
    updateDisplay() {
        this.leftCandidate.textContent = this.leftThird.toFixed(this.config.UI.DECIMAL_PLACES);
        this.rightCandidate.textContent = this.rightThird.toFixed(this.config.UI.DECIMAL_PLACES);
        this.lowerBoundDisplay.textContent = this.lowerBound.toFixed(this.config.UI.DECIMAL_PLACES);
        this.upperBoundDisplay.textContent = this.upperBound.toFixed(this.config.UI.DECIMAL_PLACES);
    }

    /**
     * 調整フェーズの表示
     */
    showAdjustmentPhase() {
        this.setupPhase.classList.add('hidden');
        this.adjustmentPhase.classList.remove('hidden');
        this.backPhase.classList.remove('hidden');
        this.finishPhase.classList.add('hidden');
    }

    /**
     * 完了フェーズの表示
     */
    showFinishPhase() {
        this.setupPhase.classList.add('hidden');
        this.adjustmentPhase.classList.add('hidden');
        this.backPhase.classList.add('hidden');
        this.finishPhase.classList.remove('hidden');
        // 最終感度は範囲の中央値
        const finalValue = (this.lowerBound + this.upperBound) / 2;
        this.finalSensitivity.textContent = finalValue.toFixed(this.config.UI.DECIMAL_PLACES);
        this.showSuccess(`最適な感度が見つかりました: ${finalValue.toFixed(this.config.UI.DECIMAL_PLACES)}`);
    }

    /**
     * アプリケーションのリセット
     */
    reset() {
        this.setupPhase.classList.remove('hidden');
        this.adjustmentPhase.classList.add('hidden');
        this.backPhase.classList.add('hidden');
        this.finishPhase.classList.add('hidden');
        
        this.dpiInput.value = '';
        this.dpiButtons.forEach(btn => btn.classList.remove('active'));
        
        this.inputDPI = 0;
        this.lowerBound = 0;
        this.upperBound = 0;
        this.leftThird = 0;
        this.rightThird = 0;
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    new MouseSensitivityUtility();
});
