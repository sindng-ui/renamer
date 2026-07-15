import React, { useState } from 'react';
import type { RenameOptions } from '../utils/renameRules';

interface RenameRulesProps {
  options: RenameOptions;
  onChange: (options: RenameOptions) => void;
}

export const RenameRules: React.FC<RenameRulesProps> = ({ options, onChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Local string inputs for seamless editing/deleting of numbers
  const [randomLengthInput, setRandomLengthInput] = useState<string>(String(options.randomLength));
  const [truncateLengthInput, setTruncateLengthInput] = useState<string>(String(options.truncateLength || ''));
  const [startIndexInput, setStartIndexInput] = useState<string>(String(options.startIndex));

  // Sync local states if props change externally
  React.useEffect(() => {
    setRandomLengthInput(String(options.randomLength));
  }, [options.randomLength]);

  React.useEffect(() => {
    setTruncateLengthInput(String(options.truncateLength || ''));
  }, [options.truncateLength]);

  React.useEffect(() => {
    setStartIndexInput(String(options.startIndex));
  }, [options.startIndex]);

  const updateOption = <K extends keyof RenameOptions>(key: K, value: RenameOptions[K]) => {
    const updated = {
      ...options,
      [key]: value,
    };
    onChange(updated);
  };

  // Close custom modal and automatically set mode to custom
  const handleApplyCustom = () => {
    updateOption('mode', 'custom');
    setIsModalOpen(false);
  };

  // Switch back to random mode directly from the main view
  const handleSetRandomMode = () => {
    updateOption('mode', 'random');
  };

  return (
    <div className="premium-card animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.85rem 1.1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🎲</span>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            이름 변경 규칙
          </h2>
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: 600,
            padding: '0.15rem 0.4rem', 
            borderRadius: '12px',
            backgroundColor: options.mode === 'random' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(6, 182, 212, 0.15)',
            color: options.mode === 'random' ? 'var(--color-neon-pink)' : 'var(--color-neon-cyan)',
            border: `1px solid ${options.mode === 'random' ? 'rgba(236, 72, 153, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`
          }}>
            {options.mode === 'random' ? '랜덤 중복방지 적용됨' : '커스텀 규칙 적용됨'}
          </span>
        </div>
        
        {options.mode === 'custom' && (
          <button 
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: 'var(--color-neon-pink)', borderColor: 'rgba(236, 72, 153, 0.2)' }}
            onClick={handleSetRandomMode}
          >
            랜덤 모드로 복귀
          </button>
        )}
      </div>

      {/* Main compact layout: Expose random options by default */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {options.mode === 'random' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                랜덤 길이
              </label>
              <input
                type="number"
                className="form-input"
                value={randomLengthInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setRandomLengthInput(val);
                  const parsed = parseInt(val, 10);
                  if (!isNaN(parsed)) {
                    updateOption('randomLength', parsed);
                  }
                }}
                onBlur={() => {
                  const parsed = parseInt(randomLengthInput, 10);
                  const clamped = isNaN(parsed) ? 8 : Math.min(20, Math.max(4, parsed));
                  setRandomLengthInput(String(clamped));
                  updateOption('randomLength', clamped);
                }}
                min={4}
                max={20}
                style={{ padding: '0.45rem', fontSize: '0.8rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                머리말 (접두사)
              </label>
              <input
                type="text"
                className="form-input"
                value={options.randomPrefix}
                onChange={(e) => updateOption('randomPrefix', e.target.value)}
                placeholder="예: rand_"
                style={{ padding: '0.45rem', fontSize: '0.8rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                꼬리말 (접미사)
              </label>
              <input
                type="text"
                className="form-input"
                value={options.randomSuffix}
                onChange={(e) => updateOption('randomSuffix', e.target.value)}
                placeholder="예: _temp"
                style={{ padding: '0.45rem', fontSize: '0.8rem' }}
              />
            </div>
          </div>
        )}

        {/* Custom dialog trigger button */}
        <div style={{ display: 'flex', marginTop: '0.2rem' }}>
          <button 
            className="btn btn-secondary" 
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              fontSize: '0.8rem',
              borderColor: options.mode === 'custom' ? 'var(--color-neon-cyan)' : 'var(--border-color)',
              color: options.mode === 'custom' ? 'var(--color-neon-cyan)' : 'var(--text-primary)'
            }}
            onClick={() => setIsModalOpen(true)}
          >
            ⚙️ {options.mode === 'custom' ? '커스텀 규칙 설정 변경...' : '상세 커스텀 규칙으로 변경 및 설정...'}
          </button>
        </div>
      </div>

      {/* CUSTOM OPTIONS MODAL DIALOG (NO BLUR, pure opacity override) */}
      {isModalOpen && (
        <div className="dialog-overlay animate-fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="dialog-content animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>✏️ 커스텀 규칙 상세 설정</h3>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Find & Replace */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    치환할 기존 단어 (Find)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={options.findText}
                    onChange={(e) => updateOption('findText', e.target.value)}
                    placeholder="찾을 단어"
                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    새로운 단어 (Replace)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={options.replaceText}
                    onChange={(e) => updateOption('replaceText', e.target.value)}
                    placeholder="대체할 단어"
                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Prefix & Suffix */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    파일명 접두사 (Prefix)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={options.prefix}
                    onChange={(e) => updateOption('prefix', e.target.value)}
                    placeholder="맨 앞에 붙일 글자"
                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    파일명 접미사 (Suffix)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={options.suffix}
                    onChange={(e) => updateOption('suffix', e.target.value)}
                    placeholder="맨 뒤에 붙일 글자"
                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Truncate Length */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  글자 수 제한 (자르기)
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={truncateLengthInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTruncateLengthInput(val);
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed)) {
                      updateOption('truncateLength', Math.max(0, parsed));
                    } else if (val === '') {
                      updateOption('truncateLength', 0);
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseInt(truncateLengthInput, 10);
                    const clamped = isNaN(parsed) ? 0 : Math.max(0, parsed);
                    setTruncateLengthInput(clamped === 0 ? '' : String(clamped));
                    updateOption('truncateLength', clamped);
                  }}
                  placeholder="제한 없음 (0)"
                  min={0}
                  style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                />
              </div>

              {/* Date Stamp Option */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="add-date-modal"
                    checked={options.addDate}
                    onChange={(e) => updateOption('addDate', e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: 'var(--color-neon-cyan)' }}
                  />
                  <label htmlFor="add-date-modal" style={{ fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>
                    📅 날짜 정보 부착
                  </label>
                </div>
                {options.addDate && (
                  <select
                    className="form-input"
                    value={options.dateFormat}
                    onChange={(e) => updateOption('dateFormat', e.target.value as any)}
                    style={{ padding: '0.45rem', fontSize: '0.8rem', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="YYYYMMDD">YYYYMMDD (예: 20260715)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (예: 2026-07-15)</option>
                    <option value="YYYYMMDD_HHmmss">YYYYMMDD_HHmmss (예: 20260715_231321)</option>
                  </select>
                )}
              </div>

              {/* Index Counter Option */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="add-index-modal"
                    checked={options.addIndex}
                    onChange={(e) => updateOption('addIndex', e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: 'var(--color-neon-cyan)' }}
                  />
                  <label htmlFor="add-index-modal" style={{ fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>
                    🔢 순차적인 일련번호 부착
                  </label>
                </div>
                {options.addIndex && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>시작번호:</span>
                    <input
                      type="number"
                      className="form-input"
                      value={startIndexInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStartIndexInput(val);
                        const parsed = parseInt(val, 10);
                        if (!isNaN(parsed)) {
                          updateOption('startIndex', Math.max(0, parsed));
                        }
                      }}
                      onBlur={() => {
                        const parsed = parseInt(startIndexInput, 10);
                        const clamped = isNaN(parsed) ? 1 : Math.max(0, parsed);
                        setStartIndexInput(String(clamped));
                        updateOption('startIndex', clamped);
                      }}
                      style={{ width: '90px', padding: '0.45rem', fontSize: '0.8rem' }}
                      min={0}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" style={{ padding: '0.6rem 1rem' }} onClick={() => setIsModalOpen(false)}>
                닫기
              </button>
              <button className="btn btn-cyan" style={{ padding: '0.6rem 1rem' }} onClick={handleApplyCustom}>
                커스텀 규칙 적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
