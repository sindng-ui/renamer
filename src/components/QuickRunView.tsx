import React from 'react';
import type { RenameOptions } from '../utils/renameRules';
import type { RenameProgress, RenameResult } from '../hooks/useRenameScheduler';
import { ResultSummary } from './ResultSummary';

export interface LastRenameJob {
  directoryPath: string;
  fileCount: number;
  options: RenameOptions;
  timestamp: number;
}

interface QuickRunViewProps {
  lastJob: LastRenameJob;
  running: boolean;
  loadingFiles: boolean;
  progress: RenameProgress;
  results: RenameResult[];
  onExecute: () => void;
  onGoToDetail: () => void;
  onClearResults: () => void;
}

function getRuleSummaryText(opts: RenameOptions): string {
  if (opts.mode === 'random') {
    const parts = [];
    if (opts.randomPrefix) parts.push(`앞단: ${opts.randomPrefix}`);
    parts.push(`길이: ${opts.randomLength}자`);
    if (opts.randomSuffix) parts.push(`뒷단: ${opts.randomSuffix}`);
    return `🎲 랜덤 무작위 (${parts.join(', ')})`;
  }

  const rules: string[] = [];
  if (opts.findText || opts.replaceText) {
    rules.push(`치환: '${opts.findText || ''}' ➔ '${opts.replaceText || ''}'`);
  }
  if (opts.prefix) {
    rules.push(`접두사: '${opts.prefix}'`);
  }
  if (opts.suffix) {
    rules.push(`접미사: '${opts.suffix}'`);
  }
  if (opts.truncateLength > 0) {
    rules.push(`잘라내기: 앞 ${opts.truncateLength}자`);
  }
  if (opts.addDate) {
    rules.push(`날짜: ${opts.dateFormat}`);
  }
  if (opts.addIndex) {
    rules.push(`번호: #${opts.startIndex}~`);
  }

  return rules.length > 0 ? `✏️ 커스텀 규칙 (${rules.join(', ')})` : '규칙 없음 (단순 복사)';
}

export const QuickRunView: React.FC<QuickRunViewProps> = ({
  lastJob,
  running,
  loadingFiles,
  progress,
  results,
  onExecute,
  onGoToDetail,
  onClearResults,
}) => {
  const isBusy = running || loadingFiles;
  const folderName = lastJob.directoryPath.split('/').filter(Boolean).pop() || lastJob.directoryPath;

  // Calculate percentage for inline indicator
  const percent = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  // Decide button class based on options mode
  const buttonModeClass = lastJob.options.mode === 'random' ? 'mode-random' : 'mode-custom';
  const pulseClass = !isBusy ? 'pulse-active' : '';

  return (
    <div className="quick-run-layout">
      {/* Upper Welcome Header */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          ⚡ <span className="gradient-text">Quick Re-execute</span>
        </h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          마지막에 성공한 변환 작업이 감지되었습니다. 즉시 재실행할 수 있습니다.
        </p>
      </div>

      {results.length === 0 ? (
        <>
          {/* Central Big Circle Button */}
          <div className="quick-run-circle-outer">
            <button
              className={`quick-run-circle-btn ${buttonModeClass} ${pulseClass}`}
              onClick={onExecute}
              disabled={isBusy}
            >
              {loadingFiles ? (
                <>
                  <div className="quick-run-spinner"></div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--color-neon-cyan)' }}>
                    TRANSFORMING...
                  </span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem' }}>{percent}%</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '0.1rem' }}>
                  </span>
                </>
              ) : running ? (
                <>
                  <div className="quick-run-spinner" style={{ borderTopColor: 'var(--color-neon-emerald)' }}></div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--color-neon-pink)' }}>
                    TRANSFORMING...
                  </span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem' }}>{percent}%</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '0.1rem' }}>
                    {progress.processed} / {progress.total}
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '2.5rem', marginBottom: '0.3rem', display: 'block' }}>⚡</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    즉시 재실행하기
                  </span>
                  <span style={{ fontSize: '0.68rem', opacity: 0.85, marginTop: '0.4rem' }}>
                    탭하여 변환 즉시 시작
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Running Progress Bar (shows only when running) */}
          {running && (
            <div className="animate-fade-in" style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'center' }}>
              <div className="neon-progress-container" style={{ height: '6px' }}>
                <div className="neon-progress-bar" style={{ width: `${percent}%` }}></div>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {progress.currentFile || '이름 변경 중...'}
              </span>
            </div>
          )}

          {/* Quick info card */}
          <div className="quick-run-info-card animate-slide-up">
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem', marginBottom: '0.15rem' }}>
              📝 마지막 변환 이력 정보
            </div>

            <div className="quick-run-meta-row">
              <span className="quick-run-meta-label">📂 대상 폴더</span>
              <span className="quick-run-meta-value folder" title={lastJob.directoryPath}>
                {folderName} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'normal', display: 'block', marginTop: '0.1rem' }}>{lastJob.directoryPath}</span>
              </span>
            </div>

            <div className="quick-run-meta-row">
              <span className="quick-run-meta-label">📄 파일 개수</span>
              <span className="quick-run-meta-value count">{lastJob.fileCount.toLocaleString()}개 파일</span>
            </div>

            <div className="quick-run-meta-row">
              <span className="quick-run-meta-label">⚙️ 적용 규칙</span>
              <span className="quick-run-meta-value">{getRuleSummaryText(lastJob.options)}</span>
            </div>
          </div>
        </>
      ) : (
        /* Bento Grid Result Summary if execution completed */
        <div className="animate-slide-up" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <ResultSummary results={results} onClear={onClearResults} />

          <button
            className="btn btn-secondary"
            style={{ width: '100%', padding: '0.8rem', fontSize: '0.85rem' }}
            onClick={onClearResults}
          >
            🔄 확인 완료 (재실행 화면으로)
          </button>
        </div>
      )}

      {/* Action Footer to detail page */}
      {!isBusy && (
        <button
          className="btn btn-secondary animate-fade-in"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.82rem',
            borderColor: 'transparent',
            backgroundColor: 'transparent',
            color: 'var(--color-neon-cyan)',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
          onClick={onGoToDetail}
        >
          📂 다른 파일 선택 또는 상세 규칙 설정하러 가기 ➔
        </button>
      )}

      {/* Quick Run Error Display */}
      {progress.failure > 0 && !running && (
        <div style={{ fontSize: '0.72rem', color: 'var(--color-neon-red)', textAlign: 'center', marginTop: '0.5rem' }}>
          ⚠️ 일부 파일 이름 변경에 실패했습니다. 결과 요약을 확인하십시오.
        </div>
      )}
    </div>
  );
};
