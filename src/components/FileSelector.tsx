import React, { useState } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';
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
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Load favorites from localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('fav_folders') || '[]');
    } catch {
      return [];
    }
  });

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
    e.stopPropagation();
    const updated = favorites.filter((f) => f !== path);
    saveFavorites(updated);
  };

  // Launch Native File Explorer via Capawesome FilePicker (1안)
  const handleOpenFilePicker = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await FilePicker.pickFiles({
        multiple: true,
        readData: false,
      });

      if (!result.files || result.files.length === 0) {
        return;
      }

      // Convert picker results to FileRenameItems
      const items: FileRenameItem[] = result.files.map((file, idx) => {
        // Fallback to mock path for web environment simulation if physical path is missing
        const absolutePath = file.path || `/storage/emulated/0/Download/${file.name}`;
        return {
          id: `picked-${idx}-${file.name}`,
          originalName: file.name,
          newName: file.name,
          path: absolutePath,
        };
      });

      // Calculate common parent directory for display purposes
      const firstPath = items[0].path;
      const lastSlashIdx = firstPath.lastIndexOf('/');
      const parentDir = lastSlashIdx !== -1 ? firstPath.substring(0, lastSlashIdx) : 'Storage';

      onFilesSelected(items, parentDir);
      setIsCollapsed(true); // Automatically collapse for layout tidiness
    } catch (err: any) {
      console.error(err);
      setError('기기 파일 선택 중 에러가 발생했습니다. 권한 설정을 확인해 주십시오.');
    } finally {
      setLoading(false);
    }
  };

  // Read native directory via Capacitor Filesystem (Fallback / Secondary option)
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
        path: file.uri, // Full URI path
      }));

      onFilesSelected(items, path || 'Documents');
      setIsCollapsed(true);
    } catch (err: any) {
      console.error(err);
      setError('네이티브 폴더를 읽지 못했습니다. 경로를 다시 한 번 확인해 주십시오.');
    } finally {
      setLoading(false);
    }
  };

  // Load 3,000 mock files for scaling tests
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
      setIsCollapsed(true);
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
    <div className="premium-card animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.85rem 1.1rem' }}>
      {/* Accordion header */}
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
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-primary)',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'inline-block'
            }}>
              {selectedDirectory.split('/').pop() || selectedDirectory}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {selectedCount > 0 && (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-neon-cyan)', fontWeight: 600 }}>
              {selectedCount.toLocaleString()}개 선택됨
            </span>
          )}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isCollapsed ? '가져오기 ▼' : '접기 ▲'}
          </span>
        </div>
      </div>

      {/* Main Accessibility Action: Always visible unless picking files */}
      {isCollapsed && (
        <button 
          className="btn btn-cyan animate-fade-in"
          style={{ width: '100%', padding: '0.65rem 0.8rem', fontSize: '0.85rem' }}
          onClick={handleOpenFilePicker}
          disabled={loading}
        >
          {loading ? '파일 피커 실행 중...' : '📱 안드로이드 파일 탐색기 띄우기 (다중 파일 선택)'}
        </button>
      )}

      {/* Accordion content */}
      {!isCollapsed && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
          
          {/* Main Picker Button inside expanded view */}
          <button 
            className="btn btn-cyan"
            style={{ width: '100%', padding: '0.65rem 0.8rem', fontSize: '0.85rem' }}
            onClick={handleOpenFilePicker}
            disabled={loading}
          >
            {loading ? '파일 피커 실행 중...' : '📱 안드로이드 파일 탐색기 띄우기 (다중 파일 선택)'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '0.2rem 0', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>— 또는 다른 모드로 테스트 —</span>
          </div>

          {/* Quick select buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: '0.55rem', fontSize: '0.8rem' }}
              onClick={() => handleOpenFolderNative()}
              disabled={loading}
            >
              기기 Documents 폴더 읽기
            </button>
            
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: '0.55rem', fontSize: '0.8rem', borderColor: 'var(--color-neon-emerald)' }}
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
              style={{ fontSize: '0.8rem', padding: '0.5rem', flex: 1 }}
            />
            <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }}>
              이동
            </button>
          </form>

          {/* Selected directory path display with Bookmark option */}
          {selectedDirectory && (
            <div style={{ 
              backgroundColor: 'var(--bg-primary)', 
              padding: '0.5rem 0.75rem', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}>
              <div style={{ 
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                wordBreak: 'break-all',
                fontFamily: 'var(--font-mono)',
                flex: 1
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Path: </span>
                {selectedDirectory}
              </div>
              
              {!favorites.includes(selectedDirectory) && (
                <button 
                  type="button"
                  className="btn btn-secondary animate-fade-in"
                  style={{ 
                    padding: '0.2rem 0.4rem', 
                    fontSize: '0.7rem', 
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
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                ⭐ 자주 쓰는 폴더 목록
              </span>
              <div style={{ 
                display: 'flex', 
                gap: '0.4rem', 
                overflowX: 'auto', 
                paddingBottom: '0.25rem',
                scrollbarWidth: 'none'
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
                      padding: '0.3rem 0.55rem',
                      borderRadius: '20px',
                      fontSize: '0.7rem',
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
                        fontSize: '0.8rem',
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
              fontSize: '0.75rem', 
              color: 'var(--color-neon-red)',
              lineHeight: '1.4'
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
