import React, { useState, useEffect, useCallback } from 'react';
import { AppState, NotificationData, AlgorithmType } from '../../../types';
import { useLanguage } from '../hooks';

interface AdjustmentPhaseProps {
  dpi: number;
  algorithm: AlgorithmType;
  searchRange: { lower: number; upper: number };
  iterations: number;
  onFinish: (finalSensitivity: number) => void;
  onNotification: (notification: Omit<NotificationData, 'id'>) => void;
  onUpdateState: React.Dispatch<React.SetStateAction<AppState>>;
}

const AdjustmentPhase: React.FC<AdjustmentPhaseProps> = ({
  dpi,
  algorithm,
  searchRange,
  iterations,
  onFinish,
  onNotification,
  onUpdateState
}) => {
  const { t } = useLanguage();
  const [candidates, setCandidates] = useState<{ left: number; right: number }>({
    left: 0,
    right: 0
  });
  const [currentD, setCurrentD] = useState<number>(0); // Natural PSA用

  // アルゴリズム設定（元のAlgorithmManager.tsと同じ）
  const algorithmSettings = {
    baseSensi: 80,
    naturalBaseSensi: 280,
    rangeMultiplier: 8,
    convergenceThreshold: 0.001
  };

  // Natural PSAアルゴリズム用の乗算テーブル
  const getNaturalMultipliers = (iteration: number) => {
    const multiplierTable = [
      { low: 0.5, high: 1.5 },   // 1回目表示
      { low: 0.5, high: 1.5 },   // 2回目表示
      { low: 0.6, high: 1.4 },   // 3回目表示
      { low: 0.7, high: 1.3 },   // 4回目表示
      { low: 0.8, high: 1.2 },   // 5回目表示
      { low: 0.9, high: 1.1 },   // 6回目表示
      { low: 0.95, high: 1.05 }  // 7回目表示
    ];
    
    const index = Math.min(iteration, 6);
    return multiplierTable[index];
  };

  // 小数第n位以降を繰り上げする
  const roundUp = (value: number, decimals: number): number => {
    const factor = Math.pow(10, decimals);
    return Math.ceil(value * factor) / factor;
  };

  // アルゴリズムに応じた候補計算（元のAlgorithmManager.tsと完全に同じロジック）
  const calculateCandidates = useCallback((lower: number, upper: number) => {
    if (algorithm === 'ternary') {
      // 三分探索のロジック（元のupdateTernarySearchCandidatesと同じ）
      const range = upper - lower;
      const leftThird = lower + range / 3;
      const rightThird = upper - range / 3;
      
      return {
        left: leftThird,
        right: rightThird
      };
    } else {
      // Natural PSA method用の候補計算
      const multipliers = getNaturalMultipliers(iterations);
      const leftCandidate = roundUp(currentD * multipliers.low, 3);
      const rightCandidate = roundUp(currentD * multipliers.high, 3);
      
      return {
        left: leftCandidate,
        right: rightCandidate
      };
    }
  }, [algorithm, currentD, iterations]);

  useEffect(() => {
    if (algorithm === 'ternary') {
      const newCandidates = calculateCandidates(searchRange.lower, searchRange.upper);
      setCandidates(newCandidates);
    } else {
      // Natural PSA method の初期化
      const baseValue = algorithmSettings.naturalBaseSensi / dpi;
      setCurrentD(baseValue);
      // 初期候補の計算は次のuseEffectで処理される
    }
  }, [searchRange, algorithm, dpi]);

  // Natural PSAの候補更新用
  useEffect(() => {
    if (algorithm === 'natural' && currentD > 0) {
      const newCandidates = calculateCandidates(0, 0); // Natural PSAでは引数は使用されない
      setCandidates(newCandidates);
    }
  }, [currentD, algorithm, calculateCandidates]);

  const handleChoice = (choice: 'left' | 'right' | 'equal') => {
    if (algorithm === 'ternary') {
      // 三分探索の収束判定（元のprocessTernarySearchChoiceと同じ）
      const currentRange = searchRange.upper - searchRange.lower;
      
      if (currentRange < algorithmSettings.convergenceThreshold) {
        // 収束した（元のコードと同じ条件）
        const finalSensitivity = (searchRange.lower + searchRange.upper) / 2;
        onFinish(finalSensitivity);
        return;
      }

      // 範囲更新（元のprocessTernarySearchChoiceと完全に同じロジック）
      let newLower = searchRange.lower;
      let newUpper = searchRange.upper;

      switch (choice) {
        case 'left':
          newUpper = candidates.right;  // upperBound = rightThird
          break;
        case 'right':
          newLower = candidates.left;   // lowerBound = leftThird
          break;
        case 'equal':
          newLower = candidates.left;   // lowerBound = leftThird
          newUpper = candidates.right;  // upperBound = rightThird
          break;
      }

      // 状態更新
      onUpdateState(prev => ({
        ...prev,
        searchRange: { lower: newLower, upper: newUpper },
        iterations: prev.iterations + 1
      }));
    } else {
      // Natural PSA methodの処理
      if (choice === 'equal' || iterations >= 6) {
        let finalSensitivity: number;
        if (choice === 'equal') {
          finalSensitivity = (candidates.left + candidates.right) / 2;
        } else {
          // 7回目の選択された感度を最終感度とする
          finalSensitivity = choice === 'left' ? candidates.left : candidates.right;
        }
        onFinish(finalSensitivity);
        return;
      }

      // 選択された値を取得
      const selectedValue = choice === 'left' ? candidates.left : candidates.right;
      
      // 新しいd値 = (選択された値 + 前回のd) / 2
      const newD = (selectedValue + currentD) / 2;
      setCurrentD(newD);
      
      // 状態更新（Natural PSAでは範囲は変更しない）
      onUpdateState(prev => ({
        ...prev,
        iterations: prev.iterations + 1
      }));
    }
  };

  return (
    <div id="adjustmentPhase" role="region" aria-labelledby="adjustment-title">
      <div className="step">
        <h3 id="adjustment-title" style={{ textAlign: 'center' }}>
          {t('ui.adjustmentTitle', '感度調整')}
        </h3>
        
        <div className="range-display" aria-live="polite">
          {algorithm === 'ternary' ? (
            <>
              <span>{t('ui.rangeLabel', '調整範囲')}:</span> 
              <span>{searchRange.lower.toFixed(3)}</span> ～ 
              <span>{searchRange.upper.toFixed(3)}</span>
            </>
          ) : (
            <>
              <span>{t('ui.dValueLabel', 'Base')}:</span> 
              <span>{currentD.toFixed(3)}</span>
            </>
          )}
        </div>
        
        <p style={{ textAlign: 'center', margin: '15px 0' }}>
          {t('ui.comparisonInstructions', '以下の2つの感度を試して、どちらが快適か選んでください')}：
        </p>
        
        <div className="ternary-comparison" role="group" aria-labelledby="candidates-label">
          <span id="candidates-label" className="sr-only">
            {t('ui.candidatesLabel', '感度候補の比較')}
          </span>
          
          <div className="candidate-option">
            <div className="candidate-label">{t('ui.candidateA', '候補A')}</div>
            <div className="candidate-value" aria-live="polite">
              {candidates.left.toFixed(3)}
            </div>
            <button 
              className="btn btn-candidate" 
              onClick={() => handleChoice('left')}
            >
              👈 {t('ui.leftOption', 'Aが快適')}
            </button>
          </div>
          
          <div className="candidate-option">
            <div className="candidate-label">{t('ui.candidateB', '候補B')}</div>
            <div className="candidate-value" aria-live="polite">
              {candidates.right.toFixed(3)}
            </div>
            <button 
              className="btn btn-candidate" 
              onClick={() => handleChoice('right')}
            >
              👉 {t('ui.rightOption', 'Bが快適')}
            </button>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            className="btn btn-equal" 
            onClick={() => handleChoice('equal')}
          >
            {algorithm === 'natural' ? t('ui.equalOptionNatural', '✅ 完了') : t('ui.equalOption', '⚖️ どちらも同じ')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdjustmentPhase;
