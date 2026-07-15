import React from 'react';
import type { RenameOptions } from '../utils/renameRules';

interface RenameRulesProps {
  options: RenameOptions;
  onChange: (options: RenameOptions) => void;
}

export const RenameRules: React.FC<RenameRulesProps> = ({ options, onChange }) => {
  const updateOption = <K extends keyof RenameOptions>(key: K, value: RenameOptions[K]) => {
    onChange({
      ...options,
      [key]: value,
    });
  };

  return (
    <div className="premium-card animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
        ⚙️ 리네임 규칙 설정
      </h2>

      {/* Mode Selector Tab */}
      <div style={{ 
        display: 'flex', 
        backgroundColor: 'var(--bg-primary)', 
        borderRadius: 'var(--radius-md)', 
        padding: '0.25rem',
        border: '1px solid var(--border-color)'
      }}>
        <button
          className="btn"
          style={{ 
            flex: 1, 
            padding: '0.5rem', 
            borderRadius: 'var(--radius-sm)',
            background: options.mode === 'custom' ? 'var(--bg-tertiary)' : 'transparent',
            boxShadow: options.mode === 'custom' ? 'var(--border-glow-cyan)' : 'none',
            borderColor: options.mode === 'custom' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
            fontSize: '0.85rem'
          }}
          onClick={() => updateOption('mode', 'custom')}
        >
          ✏️ 커스텀 규칙 지정
        </button>
        <button
          className="btn"
          style={{ 
            flex: 1, 
            padding: '0.5rem', 
            borderRadius: 'var(--radius-sm)',
            background: options.mode === 'random' ? 'var(--bg-tertiary)' : 'transparent',
            boxShadow: options.mode === 'random' ? 'var(--border-glow-pink)' : 'none',
            borderColor: options.mode === 'random' ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
            fontSize: '0.85rem'
          }}
          onClick={() => updateOption('mode', 'random')}
        >
          🎲 원클릭 랜덤 중복방지
        </button>
      </div>

      {options.mode === 'random' ? (
        /* RANDOM MODE OPTIONS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              랜덤 문자열 길이
            </label>
            <input
              type="number"
              className="form-input"
              value={options.randomLength}
              onChange={(e) => updateOption('randomLength', Math.max(4, parseInt(e.target.value) || 8))}
              min={4}
              max={32}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                접두사 추가
              </label>
              <input
                type="text"
                className="form-input"
                value={options.randomPrefix}
                onChange={(e) => updateOption('randomPrefix', e.target.value)}
                placeholder="예: rand_"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                접미사 추가
              </label>
              <input
                type="text"
                className="form-input"
                value={options.randomSuffix}
                onChange={(e) => updateOption('randomSuffix', e.target.value)}
                placeholder="예: _temp"
              />
            </div>
          </div>
        </div>
      ) : (
        /* CUSTOM RULE OPTIONS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Find & Replace */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                기존 단어 치환 대상
              </label>
              <input
                type="text"
                className="form-input"
                value={options.findText}
                onChange={(e) => updateOption('findText', e.target.value)}
                placeholder="찾을 단어"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                바꿀 새로운 단어
              </label>
              <input
                type="text"
                className="form-input"
                value={options.replaceText}
                onChange={(e) => updateOption('replaceText', e.target.value)}
                placeholder="새로운 단어"
              />
            </div>
          </div>

          {/* Prefix & Suffix */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                파일명 맨 앞 추가 (접두사)
              </label>
              <input
                type="text"
                className="form-input"
                value={options.prefix}
                onChange={(e) => updateOption('prefix', e.target.value)}
                placeholder="앞머리 텍스트"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                파일명 맨 뒤 추가 (접미사)
              </label>
              <input
                type="text"
                className="form-input"
                value={options.suffix}
                onChange={(e) => updateOption('suffix', e.target.value)}
                placeholder="꼬리표 텍스트"
              />
            </div>
          </div>

          {/* Truncate Length */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              글자 수 제한 (자르기)
            </label>
            <input
              type="number"
              className="form-input"
              value={options.truncateLength || ''}
              onChange={(e) => updateOption('truncateLength', Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="제한 없음 (0)"
              min={0}
            />
          </div>

          {/* Date Stamp Option */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="add-date-checkbox"
                checked={options.addDate}
                onChange={(e) => updateOption('addDate', e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-neon-cyan)' }}
              />
              <label htmlFor="add-date-checkbox" style={{ fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                📅 날짜 정보 부착하기
              </label>
            </div>
            {options.addDate && (
              <select
                className="form-input"
                value={options.dateFormat}
                onChange={(e) => updateOption('dateFormat', e.target.value as any)}
                style={{ marginTop: '0.2rem', backgroundColor: 'var(--bg-primary)' }}
              >
                <option value="YYYYMMDD">YYYYMMDD (예: 20260715)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (예: 2026-07-15)</option>
                <option value="YYYYMMDD_HHmmss">YYYYMMDD_HHmmss (예: 20260715_231321)</option>
              </select>
            )}
          </div>

          {/* Index Counter Option */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="add-index-checkbox"
                checked={options.addIndex}
                onChange={(e) => updateOption('addIndex', e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-neon-cyan)' }}
              />
              <label htmlFor="add-index-checkbox" style={{ fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                🔢 순차적인 일련번호 붙이기
              </label>
            </div>
            {options.addIndex && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>시작번호:</span>
                <input
                  type="number"
                  className="form-input"
                  value={options.startIndex}
                  onChange={(e) => updateOption('startIndex', Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '100px' }}
                  min={0}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
