import { useState, useMemo, useEffect } from 'react';
import { previewRenameList } from './utils/renameRules';
import type { RenameOptions } from './utils/renameRules';
import { useRenameScheduler, ContentRename } from './hooks/useRenameScheduler';
import type { FileRenameItem } from './hooks/useRenameScheduler';
import { FileSelector } from './components/FileSelector';
import { RenameRules } from './components/RenameRules';
import { PreviewList } from './components/PreviewList';
import { ProgressIndicator } from './components/ProgressIndicator';
import { ResultSummary } from './components/ResultSummary';
import { ConfirmDialog } from './components/CommonDialog';
import { App as CapApp } from '@capacitor/app';
import { QuickRunView } from './components/QuickRunView';
import type { LastRenameJob } from './components/QuickRunView';

export default function App() {
  // 1. Rename Options state with local storage persistence
  const [options, setOptions] = useState<RenameOptions>(() => {
    try {
      const saved = localStorage.getItem('rename_options');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load rename options from localStorage', e);
    }
    
    return {
      mode: 'random',
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
    };
  });

  // Save options to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('rename_options', JSON.stringify(options));
  }, [options]);

  // 2. File State
  const [originalFiles, setOriginalFiles] = useState<FileRenameItem[]>([]);
  const [directoryPath, setDirectoryPath] = useState('');

  // 3. Confirm Dialog state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

  // 4. Rename Scheduler Hook
  const { progress, running, results, executeRename, stopRename, clearResults } = useRenameScheduler();

  // Debounced options state to prevent frequent preview updates while typing (2s debounce)
  const [debouncedOptions, setDebouncedOptions] = useState<RenameOptions>(options);

  // 5. Quick Run States
  const [lastJob, setLastJob] = useState<LastRenameJob | null>(() => {
    try {
      const saved = localStorage.getItem('last_rename_job');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showQuickRun, setShowQuickRun] = useState<boolean>(() => {
    return localStorage.getItem('last_rename_job') !== null;
  });
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOptions(options);
    }, 2000);
    return () => clearTimeout(timer);
  }, [options]);

  // Monitor Android back button to confirm app exit (Fixes 3번 에러)
  useEffect(() => {
    const handler = CapApp.addListener('backButton', () => {
      setIsExitConfirmOpen(true);
    });
    return () => {
      handler.then(h => h.remove());
    };
  }, []);

  // Save last successful rename job to localStorage
  useEffect(() => {
    if (results.length > 0 && !running) {
      const successCount = results.filter(r => r.success).length;
      if (successCount > 0 && directoryPath) {
        const job: LastRenameJob = {
          directoryPath,
          fileCount: successCount,
          options,
          timestamp: Date.now(),
        };
        localStorage.setItem('last_rename_job', JSON.stringify(job));
        setLastJob(job);
      }
    }
  }, [results, running, directoryPath, options]);

  // 6. Generate live preview list via useMemo for performance optimization (First 50 items for large lists with debounce)
  const previewFiles = useMemo(() => {
    if (originalFiles.length === 0) return [];
    
    const isLarge = originalFiles.length > 100;
    const filesToCompute = isLarge ? originalFiles.slice(0, 50) : originalFiles;

    const originalNames = filesToCompute.map(f => f.originalName);
    const newNames = previewRenameList(originalNames, debouncedOptions);

    return filesToCompute.map((file, idx) => ({
      ...file,
      newName: newNames[idx],
    }));
  }, [originalFiles, debouncedOptions]);

  // Handle files selection
  const handleFilesSelected = (files: FileRenameItem[], path: string) => {
    setOriginalFiles(files);
    setDirectoryPath(path);
  };

  // Helper to generate full rename list on-demand
  const getFullRenameList = (): FileRenameItem[] => {
    const originalNames = originalFiles.map(f => f.originalName);
    const newNames = previewRenameList(originalNames, options);
    return originalFiles.map((file, idx) => ({
      ...file,
      newName: newNames[idx],
    }));
  };

  // Trigger rename operation
  const handleStartRename = () => {
    if (originalFiles.length === 0 || running) return;

    if (options.mode === 'random') {
      setIsConfirmOpen(true);
    } else {
      executeRename(getFullRenameList());
    }
  };

  const handleConfirmRandomRename = () => {
    setIsConfirmOpen(false);
    executeRename(getFullRenameList());
  };

  const handleClearResults = () => {
    if (results.length > 0) {
      // Calculate full rename list using options at the time of rename to update state
      const fullRenamedList = getFullRenameList();
      const updatedFiles = fullRenamedList.map(file => {
        const result = results.find(r => r.id === file.id);
        if (result && result.success) {
          return {
            ...file,
            originalName: file.newName,
          };
        }
        return file;
      });
      setOriginalFiles(updatedFiles);
    }
    clearResults(); 
  };

  // Trigger quick execution using saved job config
  const handleQuickExecute = async () => {
    if (!lastJob || running) return;
    setLoadingFiles(true);
    try {
      const isWeb = !window.hasOwnProperty('android') && !window.hasOwnProperty('webkit');
      let items: FileRenameItem[] = [];

      if (isWeb) {
        // Web simulation fallback
        const count = lastJob.fileCount;
        const extensions = ['.png', '.jpg', '.mp4', '.pdf', '.txt', '.zip'];
        items = Array.from({ length: count }, (_, i) => {
          const ext = extensions[i % extensions.length];
          const pad = String(i + 1).padStart(4, '0');
          const name = `IMG_${pad}_MOCK${ext}`;
          return { id: `mock-${i}`, originalName: name, newName: name, path: `${lastJob.directoryPath}/${name}` };
        });
      } else {
        const result = await ContentRename.listFiles({ path: lastJob.directoryPath });
        if (!result.files || result.files.length === 0) {
          throw new Error('폴더에 파일이 없거나 접근 권한이 없습니다.');
        }
        items = result.files.map((file, idx) => ({
          id: `quick-${idx}-${file.name}`,
          originalName: file.name,
          newName: file.name,
          path: file.path,
        }));
      }

      setOriginalFiles(items);
      setDirectoryPath(lastJob.directoryPath);
      setOptions(lastJob.options);

      // Calculate rename mappings immediately using saved options
      const originalNames = items.map(f => f.originalName);
      const newNames = previewRenameList(originalNames, lastJob.options);
      const renameItems = items.map((file, idx) => ({
        ...file,
        newName: newNames[idx],
      }));

      await executeRename(renameItems);
    } catch (err: any) {
      alert(`빠른 실행 중 오류가 발생했습니다: ${err.message || err}`);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleQuickClearResults = () => {
    if (results.length > 0) {
      // Calculate full rename list using current options to update base list
      const originalNames = originalFiles.map(f => f.originalName);
      const newNames = previewRenameList(originalNames, options);
      const fullRenamedList = originalFiles.map((file, idx) => ({
        ...file,
        newName: newNames[idx],
      }));
      
      const updatedFiles = fullRenamedList.map(file => {
        const result = results.find(r => r.id === file.id);
        if (result && result.success) {
          return {
            ...file,
            originalName: file.newName,
          };
        }
        return file;
      });
      setOriginalFiles(updatedFiles);
    }
    clearResults();
  };

  if (showQuickRun && lastJob) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        width: '100%',
        padding: '0.85rem',
        gap: '0.75rem',
        overflowY: 'auto'
      }}>
        {/* Premium Neon Header */}
        <header style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingBottom: '0.4rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              ⚡ <span className="gradient-text">Bulk Renamer</span>
            </h1>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            v1.0.0
          </div>
        </header>

        <QuickRunView
          lastJob={lastJob}
          running={running}
          loadingFiles={loadingFiles}
          progress={progress}
          results={results}
          onExecute={handleQuickExecute}
          onGoToDetail={() => setShowQuickRun(false)}
          onClearResults={handleQuickClearResults}
        />

        {/* App Exit Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isExitConfirmOpen}
          title="🚪 앱 종료 확인"
          message="Bulk Renamer 앱을 종료하시겠습니까?"
          confirmText="종료"
          cancelText="취소"
          isDanger={false}
          onConfirm={() => CapApp.exitApp()}
          onCancel={() => setIsExitConfirmOpen(false)}
        />
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      width: '100%',
      padding: '0.85rem',
      gap: '0.75rem',
      overflowY: 'auto'
    }}>
      {/* Premium Neon Header */}
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingBottom: '0.4rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            ⚡ <span className="gradient-text">Bulk Renamer</span>
          </h1>
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {lastJob && (
            <button
              onClick={() => setShowQuickRun(true)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.15rem 0.4rem',
                color: 'var(--color-neon-pink)',
                fontSize: '0.62rem',
                cursor: 'pointer',
                fontWeight: 600,
                marginRight: '0.5rem',
              }}
            >
              ⚡ 퀵 모드
            </button>
          )}
          v1.0.0
        </div>
      </header>

      {/* 4. Action Command Bar (Promoted to top for accessibility) */}
      <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {originalFiles.length === 0 ? (
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', cursor: 'not-allowed', color: 'var(--text-muted)' }}
            disabled
          >
            📂 먼저 대상 폴더/파일을 가져오십시오
          </button>
        ) : !running && results.length === 0 ? (
          <button 
            className="btn btn-cyan" 
            style={{ 
              width: '100%', 
              padding: '0.9rem', 
              fontSize: '1rem',
              background: options.mode === 'random' 
                ? 'linear-gradient(135deg, var(--color-neon-pink), #c026d3)' 
                : 'linear-gradient(135deg, var(--color-neon-cyan), #0891b2)',
              boxShadow: options.mode === 'random' ? 'var(--border-glow-pink)' : 'var(--border-glow-cyan)'
            }}
            onClick={handleStartRename}
          >
            {options.mode === 'random' ? '🎲 원클릭 랜덤 이름 변경 시작' : '✏️ 커스텀 규칙 일괄 변경 시작'}
          </button>
        ) : null}
      </div>

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

      {/* 1. File Selection Section (Collapsed by default) */}
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

      {/* 3. Realtime Live Preview List (Flex-grow to occupy rest space) */}
      <PreviewList items={previewFiles} totalCount={originalFiles.length} />

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

      {/* App Exit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isExitConfirmOpen}
        title="🚪 앱 종료 확인"
        message="Bulk Renamer 앱을 종료하시겠습니까?"
        confirmText="종료"
        cancelText="취소"
        isDanger={false}
        onConfirm={() => CapApp.exitApp()}
        onCancel={() => setIsExitConfirmOpen(false)}
      />
    </div>
  );
}
