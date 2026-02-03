import React from 'react';
import './App.css';
import CustomCandlestickChart from './CustomCandlestickChart';

function App() {
  return (
    <div className="App">
      {/* <header className="App-header">
        <h1>Bitcoin Trading Charts</h1>
      </header> */}

      {/* Custom Lightweight Charts with Real Backend Data */}
      <div style={{ margin: '20px 0' }}>
        {/* <h2 style={{ padding: '0 20px', color: '#f7931a' }}>
          📈 Custom BTC Chart (Lightweight Charts - Backend API)
        </h2> */}
        <CustomCandlestickChart symbol="BTCUSDT" useRealData={true} />
      </div>

      {/* TradingView Embedded Widget */}
      {/* <div style={{ margin: '20px 0' }}>
        <h2 style={{ padding: '0 20px' }}>
          📊 TradingView Widget (Real-time)
        </h2>
        <div style={{ width: '100%', height: '600px', padding: '0 20px' }}>
          <TradingViewWidget />
        </div>
      </div> */}
    </div>
  );
}

export default App;
