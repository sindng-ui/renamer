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
import { SwipeTabContainer } from './components/SwipeTabContainer';
import type { AppTabMode } from './components/SwipeTabContainer';

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

  // 2. Active Tab persistence ('random' | 'custom')
  const [activeTab, setActiveTab] = useState<AppTabMode>(() => {
    try {
      const saved = localStorage.getItem('last_active_tab');
      if (saved === 'random' || saved === 'custom') return saved;
    } catch {}
    return 'random';
  });

  const handleTabChange = (tab: AppTabMode) => {
    setActiveTab(tab);
    localStorage.setItem('last_active_tab', tab);
  };

  // 3. File State
  const [originalFiles, setOriginalFiles] = useState<FileRenameItem[]>([]);
  const [directoryPath, setDirectoryPath] = useState('');

  // 4. Confirm Dialog state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

  // 5. Rename Scheduler Hook
  const { progress, running, results, executeRename, stopRename, clearResults } = useRenameScheduler();

  // Debounced options state to prevent frequent preview updates while typing
  const [debouncedOptions, setDebouncedOptions] = useState<RenameOptions>(options);

  // 6. Quick Run States & Recent Folders
  const [lastJob, setLastJob] = useState<LastRenameJob | null>(() => {
    try {
      const saved = localStorage.getItem('last_rename_job');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Recent folders derived from favorites
  const recentFolders = useMemo(() => {
    try {
      const saved = localStorage.getItem('renamer_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            label: item.label || item.path.split('/').filter(Boolean).pop() || item.path,
            path: item.path,
          })).slice(0, 5);
        }
      }
    } catch {}
    return lastJob ? [{ label: lastJob.directoryPath.split('/').filter(Boolean).pop() || lastJob.directoryPath, path: lastJob.directoryPath }] : [];
  }, [lastJob]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOptions(options);
    }, 2000);
    return () => clearTimeout(timer);
  }, [options]);

  // Monitor Android back button to confirm app exit
  useEffect(() => {
    const handler = CapApp.addListener('backButton', () => {
      setIsExitConfirmOpen(true);
    });
    return () => {
      handler.then(h => h.remove());
    };
  }, []);

  // Save last rename job info to localStorage
  const saveLastJobInfo = (path: string, count: number, currentOptions: RenameOptions) => {
    if (!path) return;
    const job: LastRenameJob = {
      directoryPath: path,
      fileCount: count,
      options: currentOptions,
      timestamp: Date.now(),
    };
    localStorage.setItem('last_rename_job', JSON.stringify(job));
    setLastJob(job);
  };

  // Automatically sync last job file count with actual filesystem count in background
  useEffect(() => {
    if (activeTab === 'random' && lastJob?.directoryPath) {
      const isWeb = !window.hasOwnProperty('android') && !window.hasOwnProperty('webkit');
      if (!isWeb) {
        ContentRename.listFiles({ path: lastJob.directoryPath })
          .then(res => {
            if (res.files && res.files.length > 0 && res.files.length !== lastJob.fileCount) {
              saveLastJobInfo(lastJob.directoryPath, res.files.length, lastJob.options);
            }
          })
          .catch(() => {});
      }
    }
  }, [activeTab, lastJob?.directoryPath]);

  // Save last rename job when results are generated
  useEffect(() => {
    if (results.length > 0 && !running && directoryPath) {
      const totalCount = originalFiles.length > 0 ? originalFiles.length : results.length;
      saveLastJobInfo(directoryPath, totalCount, options);
    }
  }, [results, running, directoryPath, options, originalFiles.length]);

  // Generate live preview list
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

  const handleFilesSelected = (files: FileRenameItem[], path: string) => {
    setOriginalFiles(files);
    setDirectoryPath(path);
    if (path && files.length > 0) {
      saveLastJobInfo(path, files.length, options);
    }
  };

  const getFullRenameList = (): FileRenameItem[] => {
    const originalNames = originalFiles.map(f => f.originalName);
    const newNames = previewRenameList(originalNames, options);
    return originalFiles.map((file, idx) => ({
      ...file,
      newName: newNames[idx],
    }));
  };

  const handleStartRename = () => {
    if (originalFiles.length === 0 || running) return;

    saveLastJobInfo(directoryPath, originalFiles.length, options);

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

  // Quick execution for target folder
  const handleQuickExecute = async (targetPath?: string) => {
    const folderPath = targetPath || lastJob?.directoryPath;
    if (!folderPath || running) return;
    setLoadingFiles(true);
    try {
      const isWeb = !window.hasOwnProperty('android') && !window.hasOwnProperty('webkit');
      let items: FileRenameItem[] = [];

      if (isWeb) {
        const count = (lastJob && lastJob.fileCount > 0) ? lastJob.fileCount : 1000;
        const extensions = ['.png', '.jpg', '.mp4', '.pdf', '.txt', '.zip'];
        items = Array.from({ length: count }, (_, i) => {
          const ext = extensions[i % extensions.length];
          const pad = String(i + 1).padStart(4, '0');
          const name = `IMG_${pad}_MOCK${ext}`;
          return { id: `mock-${i}`, originalName: name, newName: name, path: `${folderPath}/${name}` };
        });
      } else {
        const result = await ContentRename.listFiles({ path: folderPath });
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
      setDirectoryPath(folderPath);
      
      const currentOpts = lastJob?.options || options;
      setOptions(currentOpts);

      saveLastJobInfo(folderPath, items.length, currentOpts);

      const originalNames = items.map(f => f.originalName);
      const newNames = previewRenameList(originalNames, currentOpts);
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

  const handleSelectPresetFolder = (path: string) => {
    if (lastJob) {
      saveLastJobInfo(path, lastJob.fileCount, lastJob.options);
    } else {
      saveLastJobInfo(path, 0, options);
    }
  };

  // View 1: Random One-Button Quick View
  const renderRandomView = () => {
    if (lastJob) {
      return (
        <QuickRunView
          lastJob={lastJob}
          running={running}
          loadingFiles={loadingFiles}
          progress={progress}
          results={results}
          recentFolders={recentFolders}
          onExecute={() => handleQuickExecute()}
          onGoToDetail={() => handleTabChange('custom')}
          onClearResults={handleQuickClearResults}
          onSelectFolder={handleSelectPresetFolder}
        />
      );
    }

    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>⚡ 원버튼 랜덤 변환 모드</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          먼저 커스텀 탭에서 대상 폴더를 가져오시거나 변환을 한 번 실행하시면, 이후 앱 실행 시 이 화면에서 원버튼으로 즉시 전량 변환할 수 있습니다.
        </p>
        <button className="btn btn-cyan" onClick={() => handleTabChange('custom')}>
          📂 폴더 선택하러 가기 ➔
        </button>
      </div>
    );
  };

  // View 2: Custom Rules View
  const renderCustomView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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

      <ProgressIndicator 
        progress={progress}
        running={running}
        onStop={stopRename}
      />

      <ResultSummary 
        results={results}
        onClear={handleClearResults}
      />

      <FileSelector 
        onFilesSelected={handleFilesSelected}
        selectedCount={originalFiles.length}
        selectedDirectory={directoryPath}
      />

      <RenameRules 
        options={options}
        onChange={setOptions}
      />

      <PreviewList items={previewFiles} totalCount={originalFiles.length} />
    </div>
  );

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      width: '100%',
      padding: '0.85rem',
      gap: '0.5rem',
      overflow: 'hidden'
    }}>
      {/* Header */}
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

      {/* Swipe Gesture Tab Container */}
      <SwipeTabContainer
        activeTab={activeTab}
        onTabChange={handleTabChange}
        randomView={renderRandomView()}
        customView={renderCustomView()}
      />

      {/* Dialogs */}
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

