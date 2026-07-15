import { useState, useMemo } from 'react';
import { previewRenameList } from './utils/renameRules';
import type { RenameOptions } from './utils/renameRules';
import { useRenameScheduler } from './hooks/useRenameScheduler';
import type { FileRenameItem } from './hooks/useRenameScheduler';
import { FileSelector } from './components/FileSelector';
import { RenameRules } from './components/RenameRules';
import { PreviewList } from './components/PreviewList';
import { ProgressIndicator } from './components/ProgressIndicator';
import { ResultSummary } from './components/ResultSummary';
import { ConfirmDialog } from './components/CommonDialog';

export default function App() {
  // 1. Rename Options state
  const [options, setOptions] = useState<RenameOptions>({
    mode: 'custom',
    randomLength: 8,
    randomPrefix: 'rand_',
    randomSuffix: '',
    findText: '',
    replaceText: '',
    prefix: '',
    suffix: '',
    truncateLength: 0,
    addDate: false,
    dateFormat: 'YYYYMMDD',
    addIndex: false,
    startIndex: 1,
  });

  // 2. File State
  const [originalFiles, setOriginalFiles] = useState<FileRenameItem[]>([]);
  const [directoryPath, setDirectoryPath] = useState('');

  // 3. Confirm Dialog state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // 4. Rename Scheduler Hook
  const { progress, running, results, executeRename, stopRename } = useRenameScheduler();

  // 5. Generate live preview list via useMemo for performance optimization
  const previewFiles = useMemo(() => {
    if (originalFiles.length === 0) return [];
    
    const originalNames = originalFiles.map(f => f.originalName);
    const newNames = previewRenameList(originalNames, options);

    return originalFiles.map((file, idx) => ({
      ...file,
      newName: newNames[idx],
    }));
  }, [originalFiles, options]);

  // Handle files selection
  const handleFilesSelected = (files: FileRenameItem[], path: string) => {
    setOriginalFiles(files);
    setDirectoryPath(path);
  };

  // Trigger rename operation
  const handleStartRename = () => {
    if (previewFiles.length === 0 || running) return;

    if (options.mode === 'random') {
      // Prompt safety dialog for random bulk modification
      setIsConfirmOpen(true);
    } else {
      // Custom mode executes directly or with brief confirm
      executeRename(previewFiles, directoryPath);
    }
  };

  const handleConfirmRandomRename = () => {
    setIsConfirmOpen(false);
    executeRename(previewFiles, directoryPath);
  };

  const handleClearResults = () => {
    // Reset file list to show renamed files if successful, or keep original
    if (results.length > 0) {
      // Re-read or update original files with their new names for next run
      const updatedFiles = previewFiles.map(file => {
        const result = results.find(r => r.id === file.id);
        if (result && result.success) {
          return {
            ...file,
            originalName: file.newName, // The new name becomes the original name
          };
        }
        return file;
      });
      setOriginalFiles(updatedFiles);
    }
    // Clean up result panel state
    executeRename([], ''); 
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      width: '100%',
      padding: '1rem',
      gap: '1rem',
      overflowY: 'auto'
    }}>
      {/* Premium Neon Header */}
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            ⚡ <span className="gradient-text">Bulk Renamer</span>
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            안드로이드 대용량 파일 이름 일괄 변경 도구
          </p>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          v1.0.0
        </div>
      </header>

      {/* 1. File Selection Section */}
      <FileSelector 
        onFilesSelected={handleFilesSelected}
        selectedCount={originalFiles.length}
        selectedDirectory={directoryPath}
      />

      {/* 2. Options Setup Section */}
      <RenameRules 
        options={options}
        onChange={setOptions}
      />

      {/* 3. Realtime Live Preview List */}
      <PreviewList items={previewFiles} />

      {/* 4. Action Command Bar */}
      {originalFiles.length > 0 && !running && results.length === 0 && (
        <div className="animate-slide-up" style={{ display: 'flex', marginTop: '0.25rem' }}>
          <button 
            className="btn btn-cyan" 
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
            onClick={handleStartRename}
          >
            🔥 선택한 {originalFiles.length.toLocaleString()}개 파일 일괄 변경 시작
          </button>
        </div>
      )}

      {/* 5. Progress Stream Panel */}
      <ProgressIndicator 
        progress={progress}
        running={running}
        onStop={stopRename}
      />

      {/* 6. Operation Results Summary */}
      <ResultSummary 
        results={results}
        onClear={handleClearResults}
      />

      {/* Confirmation modal for random mode */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="🎲 랜덤 이름 일괄 변경 확인"
        message={`선택하신 ${originalFiles.length.toLocaleString()}개의 파일명을 중복되지 않는 무작위 이름으로 즉시 변경하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="변경 실행"
        cancelText="취소"
        isDanger={true}
        onConfirm={handleConfirmRandomRename}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
