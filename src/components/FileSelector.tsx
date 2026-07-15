import React, { useState } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import type { FileRenameItem } from '../hooks/useRenameScheduler';
import { ContentRename } from '../hooks/useRenameScheduler';

interface FileSelectorProps {
  onFilesSelected: (files: FileRenameItem[], directoryPath: string) => void;
  selectedCount: number;
  selectedDirectory: string;
}

interface FavoriteFolder {
  path: string;
  label: string; // User-friendly label (last folder name)
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  onFilesSelected,
  selectedCount,
  selectedDirectory,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [justLoadedPath, setJustLoadedPath] = useState<string | null>(null); // Path auto-detected from picker

  // Load favorites from localStorage
  const [favorites, setFavorites] = useState<FavoriteFolder[]>(() => {
    try {
      const raw = localStorage.getItem('fav_folders_v2');
      if (raw) return JSON.parse(raw);
      // Migrate old format if exists
      const old = localStorage.getItem('fav_folders');
      if (old) {
        const oldPaths: string[] = JSON.parse(old);
        return oldPaths.map(p => ({ path: p, label: p.split('/').filter(Boolean).pop() || p }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const saveFavorites = (updated: FavoriteFolder[]) => {
    setFavorites(updated);
    localStorage.setItem('fav_folders_v2', JSON.stringify(updated));
  };

  const addFavorite = (path: string) => {
    if (!path || favorites.some(f => f.path === path)) return;
    const label = path.split('/').filter(Boolean).pop() || path;
    const updated = [...favorites, { path, label }];
    saveFavorites(updated);
  };

  const removeFavorite = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveFavorites(favorites.filter(f => f.path !== path));
  };

  // Common helper: convert raw file objects to FileRenameItems
  const buildItems = (rawFiles: Array<{ name: string; path: string }>): FileRenameItem[] =>
    rawFiles.map((file, idx) => ({
      id: `file-${idx}-${file.name}`,
      originalName: file.name,
      newName: file.name,
      path: file.path,
    }));

  // ─── STRATEGY 1: Native FilePicker ───────────────────────────────────────
  // Opens the Android file explorer for user to pick individual files.
  // After selection, auto-detects the parent folder path for quick re-use.
  const handleOpenFilePicker = async () => {
    setLoading(true);
    setError('');
    setJustLoadedPath(null);
    try {
      const result = await FilePicker.pickFiles({ readData: false });

      if (!result.files || result.files.length === 0) {
        return;
      }

      const items: FileRenameItem[] = result.files.map((file, idx) => {
        const absolutePath = file.path || `/storage/emulated/0/Download/${file.name}`;
        return {
          id: `picked-${idx}-${file.name}`,
          originalName: file.name,
          newName: file.name,
          path: absolutePath,
        };
      });

      // Auto-detect parent folder from first selected file's path
      const firstPath = items[0].path;
      const lastSlash = firstPath.lastIndexOf('/');
      const parentDir = lastSlash !== -1 ? firstPath.substring(0, lastSlash) : '';

      onFilesSelected(items, parentDir);
      setJustLoadedPath(parentDir); // Trigger auto-register offer
      setIsCollapsed(true);
    } catch (err: any) {
      console.error(err);
      setError('파일 선택 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ─── STRATEGY 2: Load entire folder via native bridge ────────────────────
  // When user taps a favorited folder, calls Java listFiles() to get all files.
  const handleLoadFolderByPath = async (path: string) => {
    setLoading(true);
    setError('');
    setJustLoadedPath(null);
    try {
      const isWeb = !window.hasOwnProperty('android') && !window.hasOwnProperty('webkit');
      if (isWeb) {
        // Web simulation fallback
        handleLoadMockData(100, path);
        return;
      }

      const result = await ContentRename.listFiles({ path });
      if (!result.files || result.files.length === 0) {
        setError(`폴더에 파일이 없거나 접근 권한이 없습니다.\n경로: ${path}`);
        return;
      }

      const items = buildItems(result.files);
      onFilesSelected(items, path);
      setJustLoadedPath(path);
      setIsCollapsed(true);
    } catch (err: any) {
      console.error(err);
      setError(`폴더 읽기 실패: ${err.message || err}\n\n경로: ${path}\n\n'모든 파일 접근' 권한이 허용되어 있는지 확인해 주십시오.`);
    } finally {
      setLoading(false);
    }
  };

  // ─── STRATEGY 3: Capacitor Documents folder read ─────────────────────────
  const handleOpenFolderNative = async (path: string = '') => {
    setLoading(true);
    setError('');
    try {
      const result = await Filesystem.readdir({
        path,
        directory: Directory.Documents,
      });

      const items: FileRenameItem[] = result.files.map((file, idx) => ({
        id: `native-${idx}-${file.name}`,
        originalName: file.name,
        newName: file.name,
        path: file.uri,
      }));

      onFilesSelected(items, path || 'Documents');
      setIsCollapsed(true);
    } catch (err: any) {
      console.error(err);
      setError('네이티브 폴더를 읽지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Mock data for web testing ────────────────────────────────────────────
  const handleLoadMockData = (count: number = 3000, mockDir = '/storage/emulated/0/DCIM/Camera') => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      const extensions = ['.png', '.jpg', '.mp4', '.pdf', '.txt', '.zip'];
      const mockItems: FileRenameItem[] = Array.from({ length: count }, (_, i) => {
        const ext = extensions[i % extensions.length];
        const pad = String(i + 1).padStart(4, '0');
        const name = `IMG_${pad}_MOCK${ext}`;
        return { id: `mock-${i}`, originalName: name, newName: name, path: `${mockDir}/${name}` };
      });
      onFilesSelected(mockItems, mockDir);
      setIsCollapsed(true);
      setLoading(false);
    }, 50);
  };

  const isAlreadyFavorite = favorites.some(f => f.path === justLoadedPath || f.path === selectedDirectory);
  const offerFavoritePath = justLoadedPath || selectedDirectory;

  return (
    <div className="premium-card animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.85rem 1.1rem' }}>

      {/* ── Accordion Header ─────────────────────────────── */}
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>📂</span>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            대상 폴더 및 파일
          </h2>
          {selectedDirectory && isCollapsed && (
            <span style={{
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-primary)',
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              maxWidth: '160px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'inline-block'
            }}>
              {selectedDirectory.split('/').filter(Boolean).pop() || selectedDirectory}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {selectedCount > 0 && (
            <span style={{ fontSize: '0.78rem', color: 'var(--color-neon-cyan)', fontWeight: 600 }}>
              {selectedCount.toLocaleString()}개
            </span>
          )}
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {isCollapsed ? '가져오기 ▼' : '접기 ▲'}
          </span>
        </div>
      </div>

      {/* ── Quick Picker Button (always visible when collapsed) ──────── */}
      {isCollapsed && (
        <button
          className="btn btn-cyan animate-fade-in"
          style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
          onClick={handleOpenFilePicker}
          disabled={loading}
        >
          {loading ? '로딩 중...' : '📱 파일 탐색기 열기 (파일 직접 선택)'}
        </button>
      )}

      {/* ── Auto-detect favorite offer (shows after picker selection) ── */}
      {offerFavoritePath && !isAlreadyFavorite && (
        <div className="animate-fade-in" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '0.45rem 0.7rem',
          backgroundColor: 'rgba(234, 179, 8, 0.08)',
          border: '1px solid rgba(234, 179, 8, 0.25)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
        }}>
          <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            <span style={{ color: '#eab308', marginRight: '0.3rem' }}>⭐</span>
            {offerFavoritePath.split('/').filter(Boolean).pop()} 폴더를 즐겨찾기에 추가할까요?
          </div>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem', borderColor: 'rgba(234, 179, 8, 0.3)', color: '#eab308', whiteSpace: 'nowrap' }}
            onClick={() => { addFavorite(offerFavoritePath); setJustLoadedPath(null); }}
          >
            추가
          </button>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
            onClick={() => setJustLoadedPath(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Favorite Folders List ──────────────────────────────────── */}
      {favorites.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>⭐ 즐겨찾는 폴더 (클릭하면 전체 파일 자동 로드)</span>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.35rem',
          }}>
            {favorites.map((fav) => (
              <div
                key={fav.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  backgroundColor: selectedDirectory === fav.path ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-tertiary)',
                  border: `1px solid ${selectedDirectory === fav.path ? 'rgba(6, 182, 212, 0.4)' : 'var(--border-color)'}`,
                  padding: '0.3rem 0.6rem',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  color: selectedDirectory === fav.path ? 'var(--color-neon-cyan)' : 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => !loading && handleLoadFolderByPath(fav.path)}
                title={fav.path}
              >
                <span>📁 {fav.label}</span>
                <span
                  style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1, padding: '0 0.1rem' }}
                  onClick={(e) => removeFavorite(fav.path, e)}
                  title="즐겨찾기 제거"
                >
                  ×
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Expanded View ──────────────────────────────────────────── */}
      {!isCollapsed && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>

          {/* Primary picker button */}
          <button
            className="btn btn-cyan"
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
            onClick={handleOpenFilePicker}
            disabled={loading}
          >
            {loading ? '로딩 중...' : '📱 파일 탐색기 열기 (파일 직접 선택)'}
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            — 또는 테스트용 —
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem' }}
              onClick={() => handleOpenFolderNative()}
              disabled={loading}
            >
              Documents 폴더
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem', borderColor: 'var(--color-neon-emerald)' }}
              onClick={() => handleLoadMockData(3000)}
              disabled={loading}
            >
              ⚡ 더미 3,000개
            </button>
          </div>

          {/* Selected path display */}
          {selectedDirectory && (
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              padding: '0.45rem 0.7rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              wordBreak: 'break-all',
              lineHeight: 1.5,
            }}>
              <span style={{ color: 'var(--text-muted)' }}>현재 경로: </span>{selectedDirectory}
            </div>
          )}

          {error && (
            <div style={{ fontSize: '0.72rem', color: 'var(--color-neon-red)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      )}

      {/* Error display when collapsed */}
      {isCollapsed && error && (
        <div style={{ fontSize: '0.72rem', color: 'var(--color-neon-red)', lineHeight: 1.4 }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};
