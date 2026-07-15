import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { FileRenameItem } from '../hooks/useRenameScheduler';

interface PreviewListProps {
  items: FileRenameItem[];
  rowHeight?: number;
  totalCount: number;
}

export const PreviewList: React.FC<PreviewListProps> = ({ items, rowHeight = 42, totalCount }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(300);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track height of container to recalculate visible count
  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
      
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setContainerHeight(entry.contentRect.height);
        }
      });
      
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Update scrollTop on container scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Pre-calculate visible indexes using useMemo for memoized performance
  const { visibleItems, totalHeight, translateY } = useMemo(() => {
    const total = items.length;
    const computedTotalHeight = total * rowHeight;
    
    // Determine bounds
    const startIdx = Math.max(0, Math.floor(scrollTop / rowHeight) - 3); // Buffer 3 items above
    const endIdx = Math.min(total - 1, Math.floor((scrollTop + containerHeight) / rowHeight) + 3); // Buffer 3 items below
    
    const sliced = [];
    for (let i = startIdx; i <= endIdx; i++) {
      if (items[i]) {
        sliced.push({
          item: items[i],
          index: i,
        });
      }
    }
    
    const computedTranslateY = startIdx * rowHeight;

    return {
      visibleItems: sliced,
      totalHeight: computedTotalHeight,
      translateY: computedTranslateY,
    };
  }, [items, scrollTop, containerHeight, rowHeight]);

  const isLarge = totalCount > 100;

  return (
    <div className="premium-card animate-slide-up" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      flex: 1, 
      minHeight: '260px', 
      maxHeight: '420px',
      gap: '0.65rem' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
          🔄 변경 결과 실시간 미리보기
        </h3>
        {totalCount > 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isLarge ? `상위 ${items.length}개 표시 중 / ` : ''}전체 {totalCount.toLocaleString()}개
          </span>
        )}
      </div>

      {isLarge && (
        <div className="animate-fade-in" style={{
          padding: '0.45rem 0.65rem',
          backgroundColor: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.72rem',
          color: 'var(--color-neon-cyan)',
          lineHeight: 1.4,
        }}>
          ⚡ <b>대용량 성능 최적화 (2초 대기 디바운스)</b>: 타이핑 중 렉을 막기 위해 입력이 끝난 후 2초 뒤에 상위 50개 파일의 변경 예측 결과가 갱신됩니다. (실제 적용은 전체 {totalCount.toLocaleString()}개에 완벽하게 일괄 적용됩니다!)
        </div>
      )}

      <div className="preview-table-container">
        <div className="preview-table-header">
          <div>기존 이름</div>
          <div>변경될 이름</div>
        </div>

        <div 
          ref={containerRef}
          className="preview-table-body" 
          onScroll={handleScroll}
        >
          {items.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              color: 'var(--text-muted)',
              fontSize: '0.9rem'
            }}>
              선택된 파일이 없습니다. 상단에서 파일을 가져오십시오.
            </div>
          ) : (
            <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
              <div style={{ 
                transform: `translateY(${translateY}px)`, 
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0
              }}>
                {visibleItems.map(({ item }) => {
                  const isUnchanged = item.originalName === item.newName;
                  return (
                    <div 
                      key={item.id} 
                      className="preview-row" 
                      style={{ height: `${rowHeight}px` }}
                    >
                      <div className="preview-old-name" title={item.originalName}>
                        {item.originalName}
                      </div>
                      <div 
                        className={`preview-new-name ${isUnchanged ? 'unchanged' : ''}`}
                        title={item.newName}
                      >
                        {item.newName}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
