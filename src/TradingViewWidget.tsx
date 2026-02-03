import React, { useEffect, useRef, memo } from 'react';

export interface TradingViewWidgetProps {
  symbol?: string;
  interval?: 'D' | '1' | '5' | '15' | '30' | '60' | '120' | '240' | 'W' | 'M';
  theme?: 'light' | 'dark';
  locale?: string;
  timezone?: string;
  style?: '0' | '1' | '2' | '3' | '9';
  hideSideToolbar?: boolean;
  hideTopToolbar?: boolean;
  hideLegend?: boolean;
  hideVolume?: boolean;
  allowSymbolChange?: boolean;
  saveImage?: boolean;
  backgroundColor?: string;
  gridColor?: string;
  studies?: string[];
  withdateranges?: boolean;
  details?: boolean;
  hotlist?: boolean;
  calendar?: boolean;
}

function TradingViewWidget({
  symbol = 'NASDAQ:AAPL',
  interval = 'D',
  theme = 'light',
  locale = 'en',
  timezone = 'Etc/UTC',
  style = '1',
  hideSideToolbar = false,
  hideTopToolbar = false,
  hideLegend = false,
  hideVolume = false,
  allowSymbolChange = true,
  saveImage = true,
  backgroundColor = '#ffffff',
  gridColor = 'rgba(46, 46, 46, 0.06)',
  studies = [],
  withdateranges = true,
  details = true,
  hotlist = false,
  calendar = false,
}: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (container.current) {
      // Clear previous script if exists
      if (scriptRef.current) {
        container.current.removeChild(scriptRef.current);
      }

      const script = document.createElement('script');
      script.src =
        'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        allow_symbol_change: allowSymbolChange,
        calendar,
        details,
        hide_side_toolbar: hideSideToolbar,
        hide_top_toolbar: hideTopToolbar,
        hide_legend: hideLegend,
        hide_volume: hideVolume,
        hotlist,
        interval,
        locale,
        save_image: saveImage,
        style,
        symbol,
        theme,
        timezone,
        backgroundColor,
        gridColor,
        watchlist: [],
        withdateranges,
        compareSymbols: [],
        studies,
        autosize: true,
      });

      container.current.appendChild(script);
      scriptRef.current = script;
    }

    return () => {
      if (scriptRef.current && container.current) {
        container.current.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [
    symbol,
    interval,
    theme,
    locale,
    timezone,
    style,
    hideSideToolbar,
    hideTopToolbar,
    hideLegend,
    hideVolume,
    allowSymbolChange,
    saveImage,
    backgroundColor,
    gridColor,
    studies,
    withdateranges,
    details,
    hotlist,
    calendar,
  ]);

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: '100%', width: '100%' }}
    >
      <div
        className="tradingview-widget-container__widget"
        style={{ height: 'calc(100% - 32px)', width: '100%' }}
      ></div>
      <div className="tradingview-widget-copyright">
        <a
          href={`https://www.tradingview.com/symbols/${symbol}/`}
          rel="noopener nofollow"
          target="_blank"
        >
          <span className="blue-text">{symbol} stock chart</span>
        </a>
        <span className="trademark"> by TradingView</span>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
