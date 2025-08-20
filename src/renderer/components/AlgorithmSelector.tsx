import React from 'react';
import { AlgorithmType, AlgorithmInfo } from '../../../types';
import { useLanguage } from '../hooks';

interface AlgorithmSelectorProps {
  currentAlgorithm: AlgorithmType;
  onAlgorithmChange: (algorithm: AlgorithmType) => void;
  disabled?: boolean;
}

const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({
  currentAlgorithm,
  onAlgorithmChange,
  disabled = false
}) => {
  const { t } = useLanguage();
  
  const algorithms: AlgorithmInfo[] = [
    {
      type: 'ternary',
      name: t('ui.algorithm.ternary', '三分探索PSAメソッド'),
      description: t('algorithms.ternary.description', '効率的な三分探索アルゴリズムで最適な感度を見つけます')
    },
    {
      type: 'natural',
      name: t('ui.algorithm.natural', 'ナチュラルPSAメソッド'),
      description: t('algorithms.natural.description', '自然な感覚でステップバイステップで調整します')
    }
  ];

  const currentAlgorithmInfo = algorithms.find(alg => alg.type === currentAlgorithm);

  return (
    <div className="algorithm-selector" style={{ marginBottom: '15px' }}>
      <label htmlFor="algorithmSelect" style={{ marginBottom: '5px', display: 'block' }}>
        {t('ui.algorithm.title', 'アルゴリズム選択')}:
      </label>
      <select
        id="algorithmSelect"
        value={currentAlgorithm}
        onChange={(e) => onAlgorithmChange(e.target.value as AlgorithmType)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          background: disabled ? '#f5f5f5' : 'var(--input-bg)',
          color: disabled ? '#999' : 'var(--text-color)',
          fontSize: '14px'
        }}
      >
        {algorithms.map(algorithm => (
          <option key={algorithm.type} value={algorithm.type}>
            {algorithm.name}
          </option>
        ))}
      </select>
      {currentAlgorithmInfo && (
        <div style={{ 
          fontSize: '12px', 
          color: 'var(--text-color)', 
          opacity: '0.7',
          marginTop: '5px'
        }}>
          {currentAlgorithmInfo.description}
        </div>
      )}
    </div>
  );
};

export default AlgorithmSelector;
