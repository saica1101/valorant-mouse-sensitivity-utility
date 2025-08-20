import React from 'react';
import { useLanguage } from '../hooks';

interface FinishPhaseProps {
  dpi: number;
  sensitivity: number;
  onRestart: () => void;
}

const FinishPhase: React.FC<FinishPhaseProps> = ({ 
  dpi, 
  sensitivity, 
  onRestart 
}) => {
  const { t } = useLanguage();
  const edpi = dpi * sensitivity;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // 通知は親コンポーネントで処理
    });
  };

  return (
    <div id="finishPhase" role="region" aria-labelledby="finish-title">
      <div className="finish-message">
        <h2 id="finish-title">🎉 {t('ui.finishTitle', '調整完了')}！</h2>
        <p style={{ marginBottom: '20px' }}>
          {t('ui.finishMessage', '最適なマウス感度が見つかりました')}
        </p>
        
        <div className="result-display">
          <div style={{ fontSize: '24px'}}>
            {t('ui.finalSensitivity', '感度')}: {sensitivity.toFixed(3)}
          </div>
        </div>
        
        <div className="control-buttons">
          <button 
            className="btn btn-copy"
            onClick={() => copyToClipboard(sensitivity.toFixed(3))}
          >
            📋 {t('ui.copyButton', '感度をコピー')}
          </button>
          
          <button 
            className="btn btn-retry"
            onClick={onRestart}
          >
            🔄 {t('ui.restartButton', '再調整')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinishPhase;
