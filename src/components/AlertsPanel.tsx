import React, { useState, useEffect } from 'react';
import './AlertsPanel.css';

interface Alert {
  id: number;
  symbol: string;
  price: number | null;
  indicator: string | null;
  signal: string | null;
  message: string;
  timestamp: string;
  raw_data: string;
}

interface AlertStats {
  total: number;
  last24h: number;
  bySymbol: Array<{ symbol: string; count: number }>;
  bySignal: Array<{ signal: string; count: number }>;
}

const API_URL = 'http://localhost:3001';

function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch alerts
  const fetchAlerts = async (symbol?: string) => {
    try {
      const url = symbol
        ? `${API_URL}/api/alerts?symbol=${symbol}&limit=50`
        : `${API_URL}/api/alerts?limit=50`;
      const response = await fetch(url);
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/alerts/stats/summary`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAlerts(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Auto refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAlerts(selectedSymbol);
      fetchStats();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedSymbol]);

  // Filter by symbol
  const handleSymbolFilter = (symbol: string) => {
    setSelectedSymbol(symbol);
    fetchAlerts(symbol || undefined);
  };

  // Delete alert
  const handleDelete = async (id: number) => {
    if (!window.confirm('Xóa alert này?')) return;

    try {
      await fetch(`${API_URL}/api/alerts/${id}`, { method: 'DELETE' });
      fetchAlerts(selectedSymbol);
      fetchStats();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN');
  };

  // Get signal color
  const getSignalColor = (signal: string | null) => {
    if (!signal) return 'gray';
    const s = signal.toUpperCase();
    if (s.includes('BUY')) return 'green';
    if (s.includes('SELL')) return 'red';
    return 'blue';
  };

  if (loading) {
    return <div className="alerts-panel loading">⏳ Loading alerts...</div>;
  }

  return (
    <div className="alerts-panel">
      <div className="alerts-header">
        <h2>📊 TradingView Alerts</h2>
        <div className="alerts-controls">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto Refresh (5s)
          </label>
          <button
            onClick={() => {
              fetchAlerts(selectedSymbol);
              fetchStats();
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="alerts-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Alerts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.last24h}</div>
            <div className="stat-label">Last 24h</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.bySymbol.length}</div>
            <div className="stat-label">Symbols</div>
          </div>
        </div>
      )}

      {/* Symbol filter */}
      {stats && stats.bySymbol.length > 0 && (
        <div className="symbol-filter">
          <button
            className={!selectedSymbol ? 'active' : ''}
            onClick={() => handleSymbolFilter('')}
          >
            All
          </button>
          {stats.bySymbol.map((item) => (
            <button
              key={item.symbol}
              className={selectedSymbol === item.symbol ? 'active' : ''}
              onClick={() => handleSymbolFilter(item.symbol)}
            >
              {item.symbol} ({item.count})
            </button>
          ))}
        </div>
      )}

      {/* Alerts list */}
      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="no-alerts">
            <p>📭 Chưa có alerts nào</p>
            <p className="hint">
              Tạo alert trên TradingView với webhook URL:{' '}
              <code>http://localhost:3001/webhook/tradingview</code>
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="alert-card">
              <div className="alert-header">
                <div className="alert-symbol">{alert.symbol}</div>
                {alert.signal && (
                  <div
                    className="alert-signal"
                    style={{ backgroundColor: getSignalColor(alert.signal) }}
                  >
                    {alert.signal}
                  </div>
                )}
                <div className="alert-time">
                  {formatTimestamp(alert.timestamp)}
                </div>
              </div>
              <div className="alert-body">
                {alert.price && (
                  <div className="alert-price">
                    💰 ${alert.price.toLocaleString()}
                  </div>
                )}
                {alert.indicator && (
                  <div className="alert-indicator">📈 {alert.indicator}</div>
                )}
                <div className="alert-message">{alert.message}</div>
              </div>
              <div className="alert-footer">
                <button
                  className="btn-view-raw"
                  onClick={() => {
                    try {
                      const data = JSON.parse(alert.raw_data);
                      window.alert(JSON.stringify(data, null, 2));
                    } catch {
                      window.alert(alert.raw_data);
                    }
                  }}
                >
                  View Raw
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(alert.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AlertsPanel;
