import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { FileRenameItem } from '../hooks/useRenameScheduler';

interface PreviewListProps {
  items: FileRenameItem[];
  rowHeight?: number;
}

export const PreviewList: React.FC<PreviewListProps> = ({ items, rowHeight = 42 }) => {
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

  return (
    <div className="premium-card animate-slide-up" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      flex: 1, 
      minHeight: '260px', 
      maxHeight: '400px',
      gap: '0.75rem' 
    }}>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
        🔄 변경 결과 실시간 미리보기
      </h3>

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
