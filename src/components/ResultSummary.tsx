import React, { useState } from 'react';
import type { RenameResult } from '../hooks/useRenameScheduler';

interface ResultSummaryProps {
  results: RenameResult[];
  onClear: () => void;
}

export const ResultSummary: React.FC<ResultSummaryProps> = ({ results, onClear }) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  if (results.length === 0) return null;

  const total = results.length;
  const successCount = results.filter((r) => r.success).length;
  const failureCount = total - successCount;
  const failures = results.filter((r) => !r.success);

  return (
    <div className="premium-card animate-slide-up" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '0.6rem',
      padding: '0.85rem 1rem',
      borderLeft: '4px solid var(--color-neon-emerald)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
          📊 작업 결과 요약 보고
        </h3>
        <button 
          className="btn btn-secondary" 
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}
          onClick={onClear}
        >
          결과 닫기
        </button>
      </div>

      {/* Bento Grid Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '0.5rem' 
      }}>
        {/* Total Card */}
        <div style={{ 
          backgroundColor: 'var(--bg-primary)', 
          border: '1px solid var(--border-color)', 
          padding: '0.5rem 0.4rem', 
          borderRadius: 'var(--radius-md)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>총 변환 건수</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--text-primary)' }}>
            {total.toLocaleString()}
          </div>
        </div>

        {/* Success Card */}
        <div style={{ 
          backgroundColor: 'rgba(16, 185, 129, 0.05)', 
          border: '1px solid rgba(16, 185, 129, 0.15)', 
          padding: '0.75rem', 
          borderRadius: 'var(--radius-md)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-neon-emerald)', fontWeight: 500 }}>성공</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--color-neon-emerald)' }}>
            {successCount.toLocaleString()}
          </div>
        </div>

        {/* Failure Card (Highlighted in red only if there are errors) */}
        <div style={{ 
          backgroundColor: failureCount > 0 ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-primary)', 
          border: failureCount > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--border-color)', 
          padding: '0.75rem', 
          borderRadius: 'var(--radius-md)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.7rem', color: failureCount > 0 ? 'var(--color-neon-red)' : 'var(--text-secondary)', fontWeight: 500 }}>실패</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.2rem', color: failureCount > 0 ? 'var(--color-neon-red)' : 'var(--text-primary)' }}>
            {failureCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Failure Details Section */}
      {failureCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
          <button 
            className="btn btn-secondary" 
            style={{ 
              width: '100%', 
              justifyContent: 'space-between', 
              fontSize: '0.8rem',
              padding: '0.5rem 0.75rem',
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}
            onClick={() => setShowErrorDetails(!showErrorDetails)}
          >
            <span>⚠️ 에러 발생 파일 상세 사유 보기</span>
            <span>{showErrorDetails ? '접기 ▲' : '펼치기 ▼'}</span>
          </button>
          
          {showErrorDetails && (
            <div style={{ 
              backgroundColor: '#0c0f16', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-sm)',
              maxHeight: '180px',
              overflowY: 'auto',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem'
            }}>
              {failures.map((fail) => (
                <div 
                  key={fail.id} 
                  style={{ 
                    fontSize: '0.75rem', 
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    paddingBottom: '0.4rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fail.originalName}
                  </div>
                  <div style={{ color: 'var(--color-neon-red)', marginTop: '0.1rem', fontSize: '0.7rem' }}>
                    ㄴ 사유: {fail.error}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
