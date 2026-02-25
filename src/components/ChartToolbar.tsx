import React, { useState } from 'react';
import './ChartToolbar.scss';

export type DrawingTool =
  | 'cursor'
  | 'crosshair'
  | 'trendline'
  | 'horizontal-line'
  | 'vertical-line'
  | 'ray'
  | 'fibonacci'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'text'
  | 'measure'
  | 'brush'
  | 'eraser';

interface ToolbarItem {
  id: DrawingTool;
  icon: string;
  label: string;
  shortcut?: string;
}

interface ChartToolbarProps {
  activeTool: DrawingTool;
  onToolSelect: (tool: DrawingTool) => void;
}

const toolbarItems: ToolbarItem[] = [
  { id: 'cursor', icon: '🖱️', label: 'Cursor', shortcut: 'Esc' },
  { id: 'crosshair', icon: '✛', label: 'Crosshair', shortcut: 'Alt+C' },
  { id: 'trendline', icon: '📈', label: 'Trend Line', shortcut: 'Alt+T' },
  {
    id: 'horizontal-line',
    icon: '—',
    label: 'Horizontal Line',
    shortcut: 'Alt+H',
  },
  { id: 'vertical-line', icon: '│', label: 'Vertical Line', shortcut: 'Alt+V' },
  { id: 'ray', icon: '→', label: 'Ray', shortcut: 'Alt+R' },
  {
    id: 'fibonacci',
    icon: '🔢',
    label: 'Fibonacci Retracement',
    shortcut: 'Alt+F',
  },
  { id: 'rectangle', icon: '▭', label: 'Rectangle', shortcut: 'Alt+Shift+R' },
  { id: 'circle', icon: '○', label: 'Circle', shortcut: 'Alt+Shift+C' },
  { id: 'triangle', icon: '△', label: 'Triangle', shortcut: 'Alt+Shift+T' },
  { id: 'text', icon: 'A', label: 'Text', shortcut: 'Alt+Shift+A' },
  { id: 'measure', icon: '📏', label: 'Measure', shortcut: 'Alt+M' },
  { id: 'brush', icon: '🖌️', label: 'Brush', shortcut: 'Alt+B' },
  { id: 'eraser', icon: '🧹', label: 'Eraser', shortcut: 'Alt+E' },
];

function ChartToolbar({ activeTool, onToolSelect }: ChartToolbarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredTool, setHoveredTool] = useState<DrawingTool | null>(null);

  return (
    <div className={`chart-toolbar ${collapsed ? 'collapsed' : ''}`}>
      {/* Collapse/Expand Button */}
      <div className="toolbar-header">
        <button
          className="toolbar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand Toolbar' : 'Collapse Toolbar'}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      {/* Toolbar Items */}
      <div className="toolbar-items">
        {toolbarItems.map((item) => (
          <div
            key={item.id}
            className={`toolbar-item ${activeTool === item.id ? 'active' : ''}`}
            onClick={() => onToolSelect(item.id)}
            onMouseEnter={() => setHoveredTool(item.id)}
            onMouseLeave={() => setHoveredTool(null)}
            title={`${item.label}${item.shortcut ? ` (${item.shortcut})` : ''}`}
          >
            <span className="toolbar-icon">{item.icon}</span>
            {!collapsed && <span className="toolbar-label">{item.label}</span>}

            {/* Tooltip on hover (when collapsed) */}
            {collapsed && hoveredTool === item.id && (
              <div className="toolbar-tooltip">
                <div className="tooltip-title">{item.label}</div>
                {item.shortcut && (
                  <div className="tooltip-shortcut">{item.shortcut}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Separator */}
      <div className="toolbar-separator"></div>

      {/* Settings/Info */}
      <div className="toolbar-footer">
        <div
          className="toolbar-item"
          onClick={() => console.log('Settings clicked')}
          title="Settings"
        >
          <span className="toolbar-icon">⚙️</span>
          {!collapsed && <span className="toolbar-label">Settings</span>}
        </div>
      </div>
    </div>
  );
}

export default ChartToolbar;
