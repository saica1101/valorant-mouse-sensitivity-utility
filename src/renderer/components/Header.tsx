import React from 'react';
import { AlgorithmType } from '../../../types';
import { useLanguage } from '../hooks';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  showBackButton: boolean;
  onBack: () => void;
  version: string;
  algorithm?: AlgorithmType;
  showAlgorithmInfo?: boolean; // 感度調整中かどうかを示すフラグ
}

const Header: React.FC<HeaderProps> = ({ 
  isDarkMode, 
  onToggleTheme, 
  showBackButton, 
  onBack,
  version,
  algorithm = 'ternary',
  showAlgorithmInfo = false
}) => {
  const { t } = useLanguage();
  
  const getAlgorithmName = (alg: AlgorithmType) => {
    return alg === 'ternary' 
      ? t('ui.algorithm.ternary', '三分探索PSAメソッド')
      : t('ui.algorithm.natural', 'ナチュラルPSAメソッド');
  };
  return (
    <>
      {/* ヘッダーボタンコンテナ */}
      <div className="header-buttons">
        <div id="backPhase" className={showBackButton ? '' : 'hidden'}>
          <button 
            className="btn btn-back" 
            onClick={onBack}
            aria-label={t('ui.backButton', '戻る')}
          >
            🔙 {t('ui.backButton', '戻る')}
          </button>
        </div>
        <button 
          className="theme-toggle" 
          onClick={onToggleTheme}
          aria-label={t('ui.themeToggle', 'テーマ切り替え')}
        >
          {isDarkMode ? '☀️' : '🌙'} {isDarkMode ? t('ui.lightMode', 'ライトモード') : t('ui.darkMode', 'ダークモード')}
        </button>
      </div>

      {/* メインヘッダー */}
      <div className="header">
        <h1>🎯 VMSU</h1>
        <p>{t('app.description', '最適なマウス感度を見つけましょう')}</p>
        <div className="version-info" role="contentinfo">
          <span id="version" aria-live="polite">{version}</span>
        </div>
        {showAlgorithmInfo && (
          <div className="algorithm-info" style={{ marginTop: '10px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
            <span>{t('ui.algorithm.title', 'アルゴリズム選択')}</span>: 
            <span id="currentAlgorithm">{getAlgorithmName(algorithm)}</span>
          </div>
        )}
      </div>
    </>
  );
};

export default Header;
