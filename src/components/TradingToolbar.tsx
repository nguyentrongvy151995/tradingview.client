import React from 'react';
import './TradingToolbar.css';

interface TradingToolbarProps {
  onDrawingToolSelect?: (tool: string) => void;
  onIndicatorClick?: () => void;
  onCompareClick?: () => void;
  onSettingsClick?: () => void;
  onFullscreenClick?: () => void;
}

const TradingToolbar: React.FC<TradingToolbarProps> = ({
  onDrawingToolSelect,
  onIndicatorClick,
  onCompareClick,
  onSettingsClick,
  onFullscreenClick
}) => {
  return (
    <div className="trading-toolbar">
      <div className="toolbar-group">
        <button 
          className="toolbar-button"
          onClick={() => onDrawingToolSelect?.('crosshair')}
          title="Crosshair"
        >
          ✚
        </button>
        <button 
          className="toolbar-button"
          onClick={() => onDrawingToolSelect?.('trendline')}
          title="Trend Line"
        >
          📈
        </button>
        <button 
          className="toolbar-button"
          onClick={() => onDrawingToolSelect?.('rectangle')}
          title="Rectangle"
        >
          ▭
        </button>
        <button 
          className="toolbar-button"
          onClick={() => onDrawingToolSelect?.('circle')}
          title="Circle"
        >
          ○
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Analysis Tools */}
      <div className="toolbar-group">
        <button 
          className="toolbar-button"
          onClick={onIndicatorClick}
          title="Indicators"
        >
          📊
        </button>
        <button 
          className="toolbar-button"
          onClick={onCompareClick}
          title="Compare"
        >
          ⚖️
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Settings */}
      <div className="toolbar-group">
        <button 
          className="toolbar-button"
          onClick={onSettingsClick}
          title="Settings"
        >
          ⚙️
        </button>
        <button 
          className="toolbar-button"
          onClick={onFullscreenClick}
          title="Fullscreen"
        >
          ⛶
        </button>
      </div>
    </div>
  );
};

export default TradingToolbar;