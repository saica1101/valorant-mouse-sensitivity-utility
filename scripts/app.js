/**
 * Valorant Mouse Sensitivity Utility - Ternary Search Algorithm
 * マウス感度調整アプリケーション - 三分探索アルゴリズム
 */

class MouseSensitivityUtility {
    constructor() {
        this.baseSensi = 80;
        this.inputDPI = 0;
        this.lowerBound = 0;
        this.upperBound = 0;
        this.leftThird = 0;  // 三分探索の左側候補
        this.rightThird = 0; // 三分探索の右側候補
        
        this.initializeElements();
        this.bindEvents();
        this.initializeTheme();
        this.loadAppVersion();
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
        const savedTheme = localStorage.getItem('theme') || 'light';
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
        localStorage.setItem('theme', theme);
        this.themeToggle.textContent = theme === 'dark' ? '☀️ ライトモード' : '🌙 ダークモード';
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
     * 感度調整の開始
     */
    startAdjustment() {
        const dpiValue = parseInt(this.dpiInput.value);
        
        if (!dpiValue || dpiValue <= 0) {
            alert('正しいDPI値を入力してください。');
            return;
        }

        this.inputDPI = dpiValue;
        
        // 仕様に基づく計算
        this.lowerBound = this.baseSensi / this.inputDPI;
        this.upperBound = this.lowerBound * 8;
        
        // 三分探索の初期化
        this.calculateTernaryPoints();

        this.showAdjustmentPhase();
        this.updateDisplay();
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
        if (Math.abs(this.upperBound - this.lowerBound) < 0.001) {
            this.showFinishPhase();
        } else {
            this.updateDisplay();
        }
    }

    /**
     * 表示の更新
     */
    updateDisplay() {
        this.leftCandidate.textContent = this.leftThird.toFixed(3);
        this.rightCandidate.textContent = this.rightThird.toFixed(3);
        this.lowerBoundDisplay.textContent = this.lowerBound.toFixed(3);
        this.upperBoundDisplay.textContent = this.upperBound.toFixed(3);
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
        this.finalSensitivity.textContent = finalValue.toFixed(3);
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

    /**
     * アプリケーションバージョンの読み込み
     */
    async loadAppVersion() {
        try {
            if (window.electronAPI && window.electronAPI.getAppVersion) {
                const version = await window.electronAPI.getAppVersion();
                this.versionElement.textContent = `v${version}`;
            }
        } catch (error) {
            console.error('Failed to load app version:', error);
        }
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    new MouseSensitivityUtility();
});
