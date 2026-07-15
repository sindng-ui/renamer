import React, { useState } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import type { FileRenameItem } from '../hooks/useRenameScheduler';

interface FileSelectorProps {
  onFilesSelected: (files: FileRenameItem[], directoryPath: string) => void;
  selectedCount: number;
  selectedDirectory: string;
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  onFilesSelected,
  selectedCount,
  selectedDirectory,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customPath, setCustomPath] = useState('');
  
  // Load favorites from localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('fav_folders') || '[]');
    } catch {
      return [];
    }
  });

  // Save favorites when updated
  const saveFavorites = (updated: string[]) => {
    setFavorites(updated);
    localStorage.setItem('fav_folders', JSON.stringify(updated));
  };

  const addFavorite = (path: string) => {
    if (!path || favorites.includes(path)) return;
    const updated = [...favorites, path];
    saveFavorites(updated);
  };

  const removeFavorite = (path: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering folder load
    const updated = favorites.filter((f) => f !== path);
    saveFavorites(updated);
  };

  // Read native directory via Capacitor Filesystem
  const handleOpenFolderNative = async (path: string = '') => {
    setLoading(true);
    setError('');
    try {
      const result = await Filesystem.readdir({
        path: path,
        directory: Directory.Documents, 
      });

      const items: FileRenameItem[] = result.files.map((file, idx) => ({
        id: `native-${idx}-${file.name}`,
        originalName: file.name,
        newName: file.name,
        path: file.uri,
      }));

      onFilesSelected(items, path || 'Documents');
    } catch (err: any) {
      console.error(err);
      setError('네이티브 폴더를 읽지 못했습니다. 경로가 올바른지 확인해 주십시오.');
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data
  const handleLoadMockData = (count: number = 3000) => {
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      const mockItems: FileRenameItem[] = [];
      const extensions = ['.png', '.jpg', '.mp4', '.pdf', '.txt', '.zip'];
      
      for (let i = 1; i <= count; i++) {
        const ext = extensions[i % extensions.length];
        const padding = String(i).padStart(4, '0');
        const filename = `DCIM_CAMERA_IMG_${padding}_MOCK${ext}`;
        mockItems.push({
          id: `mock-${i}`,
          originalName: filename,
          newName: filename,
          path: `/storage/emulated/0/DCIM/Camera/${filename}`,
        });
      }
      
      onFilesSelected(mockItems, '/storage/emulated/0/DCIM/Camera');
      setLoading(false);
    }, 50);
  };

  const handleSelectFolder = (path: string) => {
    if (path.includes('DCIM') || path.includes('mock') || path.includes('Camera')) {
      handleLoadMockData(3000);
    } else {
      handleOpenFolderNative(path === 'Documents' ? '' : path);
    }
  };

  const handleCustomPathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPath.trim()) return;
    handleSelectFolder(customPath.trim());
  };

  return (
    <div className="premium-card animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          📂 대상 폴더 및 파일 선택
        </h2>
        {selectedCount > 0 && (
          <span style={{ fontSize: '0.85rem', color: 'var(--color-neon-cyan)', fontWeight: 600 }}>
            {selectedCount.toLocaleString()}개 파일 선택됨
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Quick select buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-cyan" 
            style={{ flex: 1 }}
            onClick={() => handleOpenFolderNative()}
            disabled={loading}
          >
            {loading ? '폴더 읽는 중...' : '기기 Documents 폴더'}
          </button>
          
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1, borderColor: 'var(--color-neon-emerald)' }}
            onClick={() => handleLoadMockData(3000)}
            disabled={loading}
          >
            ⚡ 대용량 더미 (3,000개)
          </button>
        </div>

        {/* Custom path input form */}
        <form onSubmit={handleCustomPathSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            className="form-input"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            placeholder="직접 폴더 경로를 입력하세요..."
            style={{ fontSize: '0.85rem', flex: 1 }}
          />
          <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }}>
            이동
          </button>
        </form>

        {/* Selected directory path display with Bookmark option */}
        {selectedDirectory && (
          <div style={{ 
            backgroundColor: 'var(--bg-primary)', 
            padding: '0.6rem 0.8rem', 
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}>
            <div style={{ 
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              wordBreak: 'break-all',
              fontFamily: 'var(--font-mono)',
              flex: 1
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Path: </span>
              {selectedDirectory}
            </div>
            
            {/* Add to favorites button */}
            {!favorites.includes(selectedDirectory) && (
              <button 
                type="button"
                className="btn btn-secondary animate-fade-in"
                style={{ 
                  padding: '0.25rem 0.5rem', 
                  fontSize: '0.75rem', 
                  borderColor: 'rgba(234, 179, 8, 0.3)',
                  color: 'var(--color-neon-yellow)'
                }}
                onClick={() => addFavorite(selectedDirectory)}
              >
                ⭐ 등록
              </button>
            )}
          </div>
        )}

        {/* Favorite Folders Carousel/Chip list */}
        {favorites.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              ⭐ 자주 쓰는 폴더 목록
            </span>
            <div style={{ 
              display: 'flex', 
              gap: '0.4rem', 
              overflowX: 'auto', 
              paddingBottom: '0.25rem',
              scrollbarWidth: 'none' // Hide native scrollbar for premium touch experience
            }}>
              {favorites.map((fav) => (
                <div 
                  key={fav}
                  onClick={() => handleSelectFolder(fav)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'border-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-neon-cyan)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <span>{fav.split('/').pop() || fav}</span>
                  <span 
                    onClick={(e) => removeFavorite(fav, e)}
                    style={{ 
                      color: 'var(--text-muted)', 
                      fontWeight: 'bold', 
                      fontSize: '0.85rem',
                      paddingLeft: '0.1rem',
                      display: 'inline-block'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-neon-red)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ 
            fontSize: '0.8rem', 
            color: 'var(--color-neon-red)',
            lineHeight: '1.4'
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
};

