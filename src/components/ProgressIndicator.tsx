import React from 'react';
import type { RenameProgress } from '../hooks/useRenameScheduler';

interface ProgressIndicatorProps {
  progress: RenameProgress;
  running: boolean;
  onStop: () => void;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  running,
  onStop,
}) => {
  if (!running && progress.processed === 0) return null;

  const percent = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div className="premium-card animate-slide-up" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1rem', 
      borderColor: 'var(--color-neon-cyan)',
      boxShadow: running ? '0 0 15px rgba(6, 182, 212, 0.15)' : 'none'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
          {running ? '⚡ 파일 이름 일괄 변경 중...' : '✅ 변경 완료'}
        </h3>
        {running && (
          <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={onStop}>
            일시정지 / 중단
          </button>
        )}
      </div>

      {/* Progress Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
        <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>진행률</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-neon-cyan)' }}>{percent}%</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>처리 개수</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {progress.processed.toLocaleString()} / {progress.total.toLocaleString()}
          </div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>변환 속도</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-neon-emerald)' }}>
            {progress.filesPerSec} F/S
          </div>
        </div>
      </div>

      {/* Neon Progress Bar */}
      <div className="neon-progress-container">
        <div className="neon-progress-bar" style={{ width: `${percent}%` }} />
      </div>

      {/* Real-time Terminal Log Stream */}
      {running && progress.currentFile && (
        <div style={{ 
          backgroundColor: '#05070c', 
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)', 
          padding: '0.6rem 0.8rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          color: 'var(--color-neon-emerald)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          <span style={{ color: 'var(--text-muted)' }}>&gt;_ renaming: </span>
          {progress.currentFile}
        </div>
      )}
    </div>
  );
};
