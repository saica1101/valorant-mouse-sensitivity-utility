import React, { useState } from 'react';
import { NotificationData, AlgorithmType } from '../../../types';
import { useLanguage } from '../hooks';
import AlgorithmSelector from './AlgorithmSelector';

interface SetupPhaseProps {
  dpi: number;
  algorithm: AlgorithmType;
  onStart: (dpi: number) => void;
  onNotification: (notification: Omit<NotificationData, 'id'>) => void;
  onAlgorithmChange: (algorithm: AlgorithmType) => void;
}

const SetupPhase: React.FC<SetupPhaseProps> = ({ 
  dpi, 
  algorithm,
  onStart, 
  onNotification,
  onAlgorithmChange 
}) => {
  const { t } = useLanguage();
  const [currentDpi, setCurrentDpi] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const presetDpis = [400, 800, 1600, 3200];

  const handleDpiInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setCurrentDpi(value);
    setSelectedPreset(null);
  };

  const handlePresetClick = (presetDpi: number) => {
    setCurrentDpi(presetDpi);
    setSelectedPreset(presetDpi);
  };

  const handleStart = () => {
    if (!currentDpi || currentDpi < 400 || currentDpi > 50000) {
      onNotification({
        type: 'error',
        message: t('errors.dpiRange', 'DPI値は400から50000の間で入力してください')
      });
      return;
    }

    onStart(currentDpi);
  };

  return (
    <div id="setupPhase">
      <div className="step">
        <AlgorithmSelector
          currentAlgorithm={algorithm}
          onAlgorithmChange={onAlgorithmChange}
          disabled={false}
        />
        
        <h3>{t('ui.step1', 'Step 1: マウスDPIを入力または選択')}</h3>
        <div className="input-group" role="group" aria-labelledby="dpi-label">
          <label id="dpi-label" htmlFor="dpiInput">
            {t('ui.dpiLabel', 'DPI値を入力')}:
          </label>
          <input 
            type="number" 
            id="dpiInput" 
            placeholder={t('ui.dpiPlaceholder', '例: 800')}
            min="400" 
            max="50000" 
            value={currentDpi || ''}
            onChange={handleDpiInputChange}
            aria-describedby="dpi-help"
          />
          <div id="dpi-help" className="sr-only">
            {t('ui.dpiHelp', 'DPI値は400から50000の間で入力してください')}
          </div>
        </div>
        
        <div className="dpi-buttons" role="group" aria-labelledby="dpi-presets">
          <span id="dpi-presets" className="sr-only">
            {t('ui.dpiPresets', 'プリセットDPI値')}:
          </span>
          {presetDpis.map(presetDpi => (
            <button 
              key={presetDpi}
              className={`dpi-btn dpi-preset ${selectedPreset === presetDpi ? 'active' : ''}`}
              onClick={() => handlePresetClick(presetDpi)}
              aria-label={`DPI ${presetDpi}`}
            >
              {presetDpi}
            </button>
          ))}
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={handleStart}
          style={{ width: '100%', marginTop: '20px' }}
          disabled={!currentDpi}
        >
          {t('ui.startButton', '感度調整を開始')}
        </button>
      </div>
    </div>
  );
};

export default SetupPhase;
