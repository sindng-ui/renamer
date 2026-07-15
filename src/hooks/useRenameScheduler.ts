import { useState, useRef, useEffect } from 'react';
import { Filesystem } from '@capacitor/filesystem';
import { App } from '@capacitor/app';
import { registerPlugin } from '@capacitor/core';

// Exporting types and interfaces
export interface FileRenameItem {
  id: string;
  originalName: string;
  newName: string;
  path: string; // Absolute path or content:// URI to file
}

export interface RenameProgress {
  total: number;
  processed: number;
  success: number;
  failure: number;
  currentFile: string;
  filesPerSec: number;
}

export interface RenameResult {
  id: string;
  originalName: string;
  newName: string;
  success: boolean;
  error?: string;
}

// Native Bridge interface for content:// URI renaming and folder listing
interface ContentRenamePlugin {
  rename(options: { uri: string; newName: string }): Promise<{ uri: string }>;
  listFiles(options: { path: string }): Promise<{ files: Array<{ name: string; path: string; size: number }>; directory: string; count: number }>;
  checkStoragePermission(): Promise<{ granted: boolean; needsAction: boolean }>;
  openStorageSettings(): Promise<void>;
  resolveUri(options: { uri: string }): Promise<{ path: string; resolved: boolean }>;
}

const ContentRename = registerPlugin<ContentRenamePlugin>('ContentRename');

export function useRenameScheduler() {
  const [progress, setProgress] = useState<RenameProgress>({
    total: 0,
    processed: 0,
    success: 0,
    failure: 0,
    currentFile: '',
    filesPerSec: 0,
  });
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<RenameResult[]>([]);
  
  const stateRef = useRef({
    running: false,
    processed: 0,
    success: 0,
    failure: 0,
    startTime: 0,
  });

  // Monitor App state changes
  useEffect(() => {
    const handler = App.addListener('appStateChange', (state) => {
      if (!state.isActive && stateRef.current.running) {
        console.log('App is executing bulk rename in background state');
      }
    });

    return () => {
      handler.then(h => h.remove());
    };
  }, []);

  const stopRename = () => {
    stateRef.current.running = false;
    setRunning(false);
  };

  // Safe method to clear results and progress states (Fixes 1번 & 2번 에러)
  const clearResults = () => {
    setResults([]);
    setProgress({
      total: 0,
      processed: 0,
      success: 0,
      failure: 0,
      currentFile: '',
      filesPerSec: 0,
    });
  };

  const executeRename = async (
    items: FileRenameItem[],
    batchSize = 20,
    delayMs = 5
  ) => {
    if (running || items.length === 0) return;

    setRunning(true);
    setResults([]);
    
    stateRef.current = {
      running: true,
      processed: 0,
      success: 0,
      failure: 0,
      startTime: Date.now(),
    };

    setProgress({
      total: items.length,
      processed: 0,
      success: 0,
      failure: 0,
      currentFile: '',
      filesPerSec: 0,
    });

    const localResults: RenameResult[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      if (!stateRef.current.running) break;

      const chunk = items.slice(i, i + batchSize);
      
      await Promise.all(
        chunk.map(async (item) => {
          if (item.originalName === item.newName) {
            stateRef.current.processed += 1;
            stateRef.current.success += 1;
            localResults.push({
              id: item.id,
              originalName: item.originalName,
              newName: item.newName,
              success: true,
            });
            return;
          }

          try {
            const isWeb = !window.hasOwnProperty('android') && !window.hasOwnProperty('webkit');
            
            if (isWeb) {
              await new Promise(resolve => setTimeout(resolve, 1));
            } else if (item.path.startsWith('content://')) {
              // content:// URI renaming via DocumentsContract native bridge (SAF)
              await ContentRename.rename({
                uri: item.path,
                newName: item.newName,
              });
            } else {
              // Regular file path renaming
              const lastSlashIdx = item.path.lastIndexOf('/');
              if (lastSlashIdx === -1) {
                throw new Error('Invalid absolute path structure');
              }
              const parentDir = item.path.substring(0, lastSlashIdx);
              
              const fromPath = item.path;
              const toPath = `${parentDir}/${item.newName}`;

              await Filesystem.rename({
                from: fromPath,
                to: toPath,
              });
            }

            stateRef.current.processed += 1;
            stateRef.current.success += 1;
            localResults.push({
              id: item.id,
              originalName: item.originalName,
              newName: item.newName,
              success: true,
            });
          } catch (error: any) {
            console.error(`Failed to rename ${item.originalName}:`, error);
            stateRef.current.processed += 1;
            stateRef.current.failure += 1;
            localResults.push({
              id: item.id,
              originalName: item.originalName,
              newName: item.newName,
              success: false,
              error: error.message || 'Unknown error occurred',
            });
          }
        })
      );

      const elapsedSec = (Date.now() - stateRef.current.startTime) / 1000;
      const speed = elapsedSec > 0 ? Math.round(stateRef.current.processed / elapsedSec) : 0;
      
      const lastItemInChunk = chunk[chunk.length - 1];

      setProgress({
        total: items.length,
        processed: stateRef.current.processed,
        success: stateRef.current.success,
        failure: stateRef.current.failure,
        currentFile: lastItemInChunk ? lastItemInChunk.originalName : '',
        filesPerSec: speed,
      });

      if (delayMs > 0 && i + batchSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    setResults(localResults);
    setRunning(false);
    stateRef.current.running = false;
  };

  return {
    progress,
    running,
    results,
    executeRename,
    stopRename,
    clearResults,
  };
}

// Export for use in FileSelector and other components
export { ContentRename };
