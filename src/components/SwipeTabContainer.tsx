import React, { useRef, useState } from 'react';

export type AppTabMode = 'random' | 'custom';

interface SwipeTabContainerProps {
  activeTab: AppTabMode;
  onTabChange: (tab: AppTabMode) => void;
  randomView: React.ReactNode;
  customView: React.ReactNode;
}

export const SwipeTabContainer: React.FC<SwipeTabContainerProps> = ({
  activeTab,
  onTabChange,
  randomView,
  customView,
}) => {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swiping, setSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      setSwiping(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!swiping || touchStartX.current === null || touchStartY.current === null) {
      setSwiping(false);
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Check if horizontal swipe is dominant (X movement > Y movement)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 60) {
      if (deltaX < 0 && activeTab === 'random') {
        // Swipe Left: move from random to custom
        onTabChange('custom');
      } else if (deltaX > 0 && activeTab === 'custom') {
        // Swipe Right: move from custom to random
        onTabChange('random');
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    setSwiping(false);
  };

  return (
    <div className="swipe-tab-wrapper" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Neon Segmented Tab Navigation Header */}
      <div className="swipe-tab-header">
        <button
          className={`swipe-tab-btn ${activeTab === 'random' ? 'active' : ''}`}
          onClick={() => onTabChange('random')}
        >
          <span style={{ fontSize: '1rem' }}>🎲</span>
          <span>원버튼 변환 (랜덤)</span>
        </button>
        <button
          className={`swipe-tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => onTabChange('custom')}
        >
          <span style={{ fontSize: '1rem' }}>✏️</span>
          <span>커스텀 규칙 설정</span>
        </button>
      </div>

      {/* Touch Swipeable Content Area */}
      <div
        className="swipe-tab-content-area"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 1,
          width: '100%',
          overflowX: 'hidden',
          position: 'relative',
        }}
      >
        <div
          className="swipe-tab-track"
          style={{
            display: 'flex',
            width: '200%',
            height: '100%',
            transform: activeTab === 'random' ? 'translateX(0%)' : 'translateX(-50%)',
            transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          <div style={{ width: '50%', height: '100%', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {randomView}
          </div>
          <div style={{ width: '50%', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {customView}
          </div>
        </div>
      </div>
    </div>
  );
};
