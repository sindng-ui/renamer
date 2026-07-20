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
  recentFolders?: Array<{ label: string; path: string }>;
  onExecute: () => void;
  onGoToDetail: () => void;
  onClearResults: () => void;
  onSelectFolder?: (path: string) => void;
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
  recentFolders = [],
  onExecute,
  onGoToDetail,
  onClearResults,
  onSelectFolder,
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
      {/* Upper Welcome Header — hide during running to reclaim vertical space */}
      {!running && (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            ⚡ <span className="gradient-text">Quick Re-execute</span>
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            마지막 변환 대상 폴더가 감지되었습니다. 원버튼 클릭 시 해당 폴더 내의 모든 최신 파일을 실시간 스캔하여 변환합니다.
          </p>
        </div>
      )}

      {results.length === 0 ? (
        <>
          {/* ---- Running State: single centered block (circle + all progress info) ---- */}
          {running ? (
            <div className="quick-run-running-block animate-fade-in">
              {/* Compact circle (smaller while running) */}
              <div className="quick-run-circle-outer">
                <button
                  className={`quick-run-circle-btn ${buttonModeClass}`}
                  style={{ width: 'clamp(110px, 18vh, 140px)', height: 'clamp(110px, 18vh, 140px)', cursor: 'not-allowed', opacity: 0.9 }}
                  disabled
                >
                  <div className="quick-run-spinner" style={{ borderTopColor: 'var(--color-neon-emerald)', width: '36px', height: '36px', marginBottom: '0.5rem' }}></div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--color-neon-pink)' }}>
                    TRANSFORMING...
                  </span>
                </button>
              </div>

              {/* Big percent display */}
              <div style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1, color: '#fff', letterSpacing: '-0.02em' }}>
                {percent}<span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-secondary)', marginLeft: '2px' }}>%</span>
              </div>

              {/* Count */}
              <div style={{ fontSize: '0.9rem', color: 'var(--color-neon-cyan)', fontWeight: 700 }}>
                {progress.processed.toLocaleString()} / {progress.total.toLocaleString()} 개
              </div>

              {/* Progress bar */}
              <div className="neon-progress-container" style={{ height: '10px', width: '100%', maxWidth: '300px' }}>
                <div className="neon-progress-bar" style={{ width: `${percent}%`, transition: 'width 0.2s ease' }}></div>
              </div>

              {/* Current filename */}
              <div style={{
                fontSize: '0.72rem',
                color: 'var(--color-neon-cyan)',
                fontFamily: 'var(--font-mono)',
                wordBreak: 'break-all',
                textAlign: 'center',
                maxWidth: '300px',
                lineHeight: 1.4,
                minHeight: '2.2em',
              }}>
                📄 {progress.currentFile || '이름 변경 진행 중...'}
              </div>
            </div>
          ) : (
          /* ---- Normal / Idle State: big circle button ---- */
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
                    SCANNING FILES...
                  </span>
                  <span style={{ fontSize: '0.75rem', marginTop: '0.3rem', color: 'var(--text-secondary)' }}>
                    최신 파일 스캔 중...
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '2.5rem', marginBottom: '0.3rem', display: 'block' }}>⚡</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    즉시 전체 변환하기
                  </span>
                  <span style={{ fontSize: '0.68rem', opacity: 0.85, marginTop: '0.4rem' }}>
                    폴더 전체 최신 파일 실시간 스캔 및 변환
                  </span>
                </>
              )}
            </button>
          </div>
          )}

          {/* Quick info card (Hide during running to prevent vertical clipping) */}
          {!running && (
            <div className="quick-run-info-card animate-slide-up">
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', marginBottom: '0.1rem' }}>
                📝 마지막 변환 폴더 및 규칙 정보
              </div>

              <div className="quick-run-meta-row">
                <span className="quick-run-meta-label">📂 대상 폴더</span>
                <span className="quick-run-meta-value folder" title={lastJob.directoryPath}>
                  {folderName} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'normal', display: 'block', marginTop: '0.1rem' }}>{lastJob.directoryPath}</span>
                </span>
              </div>

              <div className="quick-run-meta-row">
                <span className="quick-run-meta-label">📄 변환 대상</span>
                <span className="quick-run-meta-value count">{lastJob.fileCount.toLocaleString()}개 파일 (전체 실시간 스캔)</span>
              </div>

              <div className="quick-run-meta-row">
                <span className="quick-run-meta-label">⚙️ 적용 규칙</span>
                <span className="quick-run-meta-value">{getRuleSummaryText(lastJob.options)}</span>
              </div>
            </div>
          )}

          {/* Smart Folder Chips UI (Hide during running) */}
          {recentFolders.length > 0 && !isBusy && (
            <div className="quick-folder-chips-container animate-fade-in">
              <div className="quick-folder-chips-title">
                <span>⭐ 최근 원클릭 폴더 칩</span>
              </div>
              <div className="quick-folder-chips-wrapper">
                {recentFolders.map((item, idx) => {
                  const isActive = item.path === lastJob.directoryPath;
                  return (
                    <button
                      key={`chip-${idx}-${item.path}`}
                      className={`folder-chip-btn ${isActive ? 'active' : ''}`}
                      onClick={() => onSelectFolder && onSelectFolder(item.path)}
                      title={item.path}
                    >
                      <span>📂</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Result Summary Container with Flex Overflow Fit (Fixes bottom truncation) */
        <div className="animate-slide-up" style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '0.2rem' }}>
            <ResultSummary results={results} onClear={onClearResults} />
          </div>

          <button
            className="btn btn-secondary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem', flexShrink: 0, marginTop: '0.2rem' }}
            onClick={onClearResults}
          >
            🔄 확인 완료 (재실행 화면으로)
          </button>
        </div>
      )}

      {/* Action Footer to detail page (Hide during results view or running) */}
      {!isBusy && results.length === 0 && (
        <button
          className="btn btn-secondary animate-fade-in"
          style={{
            marginTop: '0.2rem',
            fontSize: '0.8rem',
            borderColor: 'transparent',
            backgroundColor: 'transparent',
            color: 'var(--color-neon-cyan)',
            textDecoration: 'underline',
            cursor: 'pointer',
            flexShrink: 0,
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
