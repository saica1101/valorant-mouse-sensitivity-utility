import React, { useState } from 'react';
import { AppState } from '../../../types';
import { useNotifications, useTheme, useElectronAPI, useLanguage } from '../hooks';
import Header from './Header';
import SetupPhase from './SetupPhase';
import AdjustmentPhase from './AdjustmentPhase';
import FinishPhase from './FinishPhase';
import NotificationContainer from './NotificationContainer';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    currentPhase: 'setup',
    dpi: 800,
    algorithm: 'ternary',
    searchRange: { lower: 0.1, upper: 3.0 },
    iterations: 0,
    currentSensitivity: 0
  });

  const { notifications, addNotification, removeNotification } = useNotifications();
  const { isDarkMode, toggleTheme } = useTheme();
  const { version } = useElectronAPI();
  const { currentLanguage, t } = useLanguage();

  // 言語変更をアプリ状態に反映
  React.useEffect(() => {
    setAppState(prev => ({ ...prev, language: currentLanguage }));
  }, [currentLanguage]);

  const startAdjustment = (dpi: number) => {
    // DPIに基づいて動的に範囲を計算（元のAlgorithmManager.tsと同じ）
    const baseSensi = 80 / dpi;  // 基準感度
    const rangeMultiplier = 8;   // 範囲倍率
    const lowerBound = baseSensi;            // 最小値は基準感度
    const upperBound = baseSensi * rangeMultiplier;  // 最大値は基準感度 * 8
    
    setAppState(prev => ({
      ...prev,
      currentPhase: 'adjustment',
      dpi,
      searchRange: { lower: lowerBound, upper: upperBound },
      iterations: 0
    }));

    addNotification({
      type: 'info',
      message: t('notifications.adjustmentStarted', '感度調整を開始しました')
    });
  };

  const finishAdjustment = (finalSensitivity: number) => {
    setAppState(prev => ({
      ...prev,
      currentPhase: 'complete',
      currentSensitivity: finalSensitivity
    }));

    addNotification({
      type: 'success',
      message: t('notifications.adjustmentCompleted', '最適な感度が見つかりました！')
    });
  };

  const goBack = () => {
    if (appState.currentPhase === 'adjustment') {
      setAppState(prev => ({ ...prev, currentPhase: 'setup' }));
    } else if (appState.currentPhase === 'complete') {
      setAppState(prev => ({ ...prev, currentPhase: 'adjustment' }));
    }
  };

  const resetToStart = () => {
    setAppState(prev => ({
      ...prev,
      currentPhase: 'setup',
      dpi: 0,
      currentSensitivity: 0,
      searchRange: { lower: 0.1, upper: 3.0 },  // リセット時は固定値
      iterations: 0,
      algorithm: 'ternary'
    }));
  };

  const handleAlgorithmChange = (algorithm: any) => {
    setAppState(prev => ({ ...prev, algorithm }));
  };

  return (
    <div className="app">
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      <Header 
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        showBackButton={appState.currentPhase !== 'setup'}
        onBack={goBack}
        version={version}
        algorithm={appState.algorithm}
        showAlgorithmInfo={appState.currentPhase === 'adjustment'}
      />

      <div className="container" role="main">
        {appState.currentPhase === 'setup' && (
          <SetupPhase 
            dpi={appState.dpi}
            algorithm={appState.algorithm}
            onStart={startAdjustment}
            onNotification={addNotification}
            onAlgorithmChange={handleAlgorithmChange}
          />
        )}

        {appState.currentPhase === 'adjustment' && (
          <AdjustmentPhase 
            dpi={appState.dpi}
            algorithm={appState.algorithm}
            searchRange={appState.searchRange}
            iterations={appState.iterations}
            onFinish={finishAdjustment}
            onNotification={addNotification}
            onUpdateState={setAppState}
          />
        )}

        {appState.currentPhase === 'complete' && (
          <FinishPhase 
            dpi={appState.dpi}
            sensitivity={appState.currentSensitivity || 0}
            onRestart={resetToStart}
          />
        )}
      </div>
    </div>
  );
};

export default App;
