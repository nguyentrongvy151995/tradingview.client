import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, Time } from 'lightweight-charts';
import { fetchCoinAnalysis, Candle } from './services/coinAnalysisApi';
import { calculateMACD } from './utils/macdIndicator';
import { calculateRSI } from './utils/rsiIndicator';
import TradingToolbar from './components/TradingToolbar';

interface CandleData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CustomCandlestickChartProps {
  symbol?: string;
  useRealData?: boolean; // Toggle between real API data and mock data
}

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

function CustomCandlestickChart({
  symbol = 'BTCUSDT',
  useRealData = true,
}: CustomCandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Popup state
  const [popupData, setPopupData] = useState<any>(null);
  const [popupPosition, setPopupPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  // Double click selection state
  const [isSelectingRange, setIsSelectingRange] = useState(false);

  // Indicators toggles - set to false to disable
  const showMacd = false;
  const showRSI = true;
  const [firstClickTime, setFirstClickTime] = useState<Time | null>(null);
  const [selectedRangeData, setSelectedRangeData] = useState<any>(null);
  const [showRangePopup, setShowRangePopup] = useState(false);

  // Refs to avoid stale closure
  const isSelectingRangeRef = useRef(false);
  const firstClickTimeRef = useRef<Time | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || 
        (showMacd && !macdContainerRef.current) ||
        (showRSI && !rsiContainerRef.current)) {
      return;
    }

    // Clean up existing charts before creating new ones
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {
        chartRef.current = null;
      }
    }

    if (macdChartRef.current) {
      try {
        macdChartRef.current.remove();
      } catch (e) {
        macdChartRef.current = null;
      }
    }

    if (rsiChartRef.current) {
      try {
        rsiChartRef.current.remove();
      } catch (e) {
        rsiChartRef.current = null;
      }
    }

    // Clear container contents to prevent duplicates
    chartContainerRef.current.innerHTML = '';
    if (showMacd && macdContainerRef.current) {
      macdContainerRef.current.innerHTML = '';
    }
    if (showRSI && rsiContainerRef.current) {
      rsiContainerRef.current.innerHTML = '';
    }
    try {
      const chart = initChart();

      if (!chart) {
        return;
      }

      const candlestickSeries = (chart as any).addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      if (!candlestickSeries) {
        return;
      }

      // Create MACD chart (conditional)
      let macdChart: IChartApi | undefined, macdLineSeries: any, signalLineSeries: any, histogramSeries: any;
      
      // Create RSI chart (conditional)  
      let rsiChart: IChartApi | undefined, rsiLineSeries: any, overboughtSeries: any, oversoldSeries: any;
      
      if (showMacd) {
        const macdChartData = initMacdChart();
        if (!macdChartData) {
          return;
        }

        ({ macdChart, macdLineSeries, signalLineSeries, histogramSeries } = macdChartData);

        chart.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
          if (timeRange && macdChart) {
            macdChart.timeScale().setVisibleLogicalRange(timeRange);
          }
        });

        macdChart.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
          if (timeRange) {
            chart.timeScale().setVisibleLogicalRange(timeRange);
          }
        });
      }

      if (showRSI) {
        const rsiChartData = initRSIChart();
        if (!rsiChartData) {
          return;
        }

        ({ rsiChart, rsiLineSeries, overboughtSeries, oversoldSeries } = rsiChartData);

        // Sync time scales with main chart
        chart.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
          if (timeRange && rsiChart) {
            rsiChart.timeScale().setVisibleLogicalRange(timeRange);
          }
        });

        rsiChart.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
          if (timeRange) {
            chart.timeScale().setVisibleLogicalRange(timeRange);
          }
        });
      }

      loadData(
        candlestickSeries,
        macdLineSeries,
        signalLineSeries,
        histogramSeries,
        rsiLineSeries,
        overboughtSeries,
        oversoldSeries,
      );

      chartRef.current = chart;
      if (showMacd && macdChart) {
        macdChartRef.current = macdChart;
      }
      if (showRSI && rsiChart) {
        rsiChartRef.current = rsiChart;
      }
      candlestickSeriesRef.current = candlestickSeries;

      // Subscribe to crosshair move using wrapper function
      const crosshairMoveWrapper = (param: any) => {
        handleCrosshairMove(param, candlestickSeries);
      };

      chart.subscribeCrosshairMove(crosshairMoveWrapper);

      const chartContainer = chartContainerRef.current;
      if (!chartContainer) {
        return;
      }

      const doubleClickWrapper = (event: MouseEvent) => {
        handleDoubleClick(event, chart, chartContainer);
      };

      chartContainer.addEventListener('dblclick', doubleClickWrapper);

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chartContainer.removeEventListener('dblclick', doubleClickWrapper);
        chart.remove();
        if (showMacd && macdChart) {
          macdChart.remove();
        }
        if (showRSI && rsiChart) {
          rsiChart.remove();
        }
      };
    } catch (error) {}
  }, [symbol, timeframe, useRealData]);

  // Calculate dynamic height based on indicators and screen size
  const calculateChartHeight = () => {
    const screenHeight = window.innerHeight;
    const toolbarHeight = 40; // Trading toolbar
    const timeframeHeight = 60; // Timeframe selector
    const macdHeight = showMacd ? 200 : 0; // MACD indicator (conditional)
    const rsiHeight = showRSI ? 150 : 0; // RSI indicator (conditional)
    const footerHeight = 80; // Footer info (increased)
    const padding = 100; // More padding for safety

    // Future indicators can be added here
    // const volumeHeight = hasVolume ? 100 : 0;

    const totalIndicatorsHeight = macdHeight + rsiHeight; // + volumeHeight
    const availableHeight =
      screenHeight -
      toolbarHeight -
      timeframeHeight -
      totalIndicatorsHeight -
      footerHeight -
      padding;

    return Math.max(availableHeight, 300); // Minimum 300px height
  };

  const handleResize = () => {
    if (chartContainerRef.current && chartRef.current) {
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth - 1, // Subtract 1px for border
        height: calculateChartHeight(),
      });
    }
    if (macdContainerRef.current && macdChartRef.current) {
      macdChartRef.current.applyOptions({
        width: macdContainerRef.current.clientWidth - 1, // Subtract 1px for border
      });
    }
    if (rsiContainerRef.current && rsiChartRef.current) {
      rsiChartRef.current.applyOptions({
        width: rsiContainerRef.current.clientWidth - 1, // Subtract 1px for border
      });
    }
  };

  // Initialize MACD chart
  const initMacdChart = () => {
    if (!macdContainerRef.current) return null;

    const macdChart = createChart(macdContainerRef.current, {
      width: macdContainerRef.current.clientWidth - 1, // Subtract 1px for border
      height: 200,
      layout: {
        background: { color: '#1e222d' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2f3a' },
        horzLines: { color: '#2b2f3a' },
      },
      crosshair: {
        mode: 1,
      },
      timeScale: {
        borderColor: '#2b2f3a',
        timeVisible: true,
        secondsVisible: false,
        visible: false, // Hide time scale on MACD chart
      },
      rightPriceScale: {
        borderColor: '#2b2f3a',
      },
    });

    // Add MACD series
    const macdLineSeries = (macdChart as any).addLineSeries({
      color: '#2962ff',
      lineWidth: 2,
      title: 'MACD',
      priceFormat: {
        type: 'price',
        precision: 4,
        minMove: 0.0001,
      },
    });

    const signalLineSeries = (macdChart as any).addLineSeries({
      color: '#ff6d00',
      lineWidth: 2,
      title: 'Signal',
      priceFormat: {
        type: 'price',
        precision: 4,
        minMove: 0.0001,
      },
    });

    const histogramSeries = (macdChart as any).addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'price',
        precision: 4,
        minMove: 0.0001,
      },
    });

    return {
      macdChart,
      macdLineSeries,
      signalLineSeries,
      histogramSeries,
    };
  };

  // Initialize RSI chart
  const initRSIChart = () => {
    if (!rsiContainerRef.current) return null;

    const rsiChart = createChart(rsiContainerRef.current, {
      width: rsiContainerRef.current.clientWidth - 1, // Subtract 1px for border
      height: 150,
      layout: {
        background: { color: '#1e222d' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2f3a' },
        horzLines: { color: '#2b2f3a' },
      },
      crosshair: {
        mode: 1,
      },
      timeScale: {
        borderColor: '#2b2f3a',
        timeVisible: true,
        secondsVisible: false,
        visible: false, // Hide time scale on RSI chart
      },
      rightPriceScale: {
        borderColor: '#2b2f3a',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        // Set RSI range 0-100
        mode: 1, // Normal scale
      },
    });

    // Add RSI line series
    const rsiLineSeries = (rsiChart as any).addLineSeries({
      color: '#9c27b0',
      lineWidth: 2,
      title: 'RSI',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    // Add RSI overbought/oversold levels
    const overboughtSeries = (rsiChart as any).addLineSeries({
      color: '#ef5350',
      lineWidth: 1,
      lineStyle: 2, // Dashed line
      title: 'Overbought (70)',
      priceFormat: {
        type: 'price',
        precision: 0,
      },
    });

    const oversoldSeries = (rsiChart as any).addLineSeries({
      color: '#26a69a',
      lineWidth: 1,
      lineStyle: 2, // Dashed line
      title: 'Oversold (30)',
      priceFormat: {
        type: 'price',
        precision: 0,
      },
    });

    return {
      rsiChart,
      rsiLineSeries,
      overboughtSeries,
      oversoldSeries,
    };
  };

  // Update MACD data
  const updateMacdData = (
    candleData: CandleData[],
    macdLineSeries: any,
    signalLineSeries: any,
    histogramSeries: any,
  ) => {
    // Calculate and display MACD
    const closePrices = candleData.map((c) => c.close);
    const times = candleData.map((c) => c.time as string | number);
    const macdData = calculateMACD(closePrices, times);

    // Set MACD line data (filter out nulls)
    const macdLineData = macdData
      .filter((d) => d.macd !== null)
      .map((d) => ({ time: d.time as Time, value: d.macd as number }));
    macdLineSeries.setData(macdLineData);

    // Set Signal line data (filter out nulls)
    const signalLineData = macdData
      .filter((d) => d.signal !== null)
      .map((d) => ({ time: d.time as Time, value: d.signal as number }));
    signalLineSeries.setData(signalLineData);

    // Set Histogram data (filter out nulls and color based on positive/negative)
    const histogramData = macdData
      .filter((d) => d.histogram !== null)
      .map((d) => ({
        time: d.time as Time,
        value: d.histogram as number,
        color: (d.histogram as number) >= 0 ? '#26a69a' : '#ef5350',
      }));
    histogramSeries.setData(histogramData);

  };

  // Update RSI data
  const updateRSIData = (
    candleData: CandleData[],
    rsiLineSeries: any,
    overboughtSeries: any,
    oversoldSeries: any,
  ) => {
    // Calculate RSI
    const closePrices = candleData.map((c) => c.close);
    const times = candleData.map((c) => c.time as string | number);
    const rsiData = calculateRSI(closePrices, times, 14);

    // Set RSI line data (filter out nulls)
    const rsiLineData = rsiData
      .filter((d) => d.rsi !== null)
      .map((d) => ({ time: d.time as Time, value: d.rsi as number }));
    rsiLineSeries.setData(rsiLineData);

    // Set overbought level (70)
    const overboughtData = candleData.map((c) => ({ 
      time: c.time, 
      value: 70 
    }));
    overboughtSeries.setData(overboughtData);

    // Set oversold level (30)
    const oversoldData = candleData.map((c) => ({ 
      time: c.time, 
      value: 30 
    }));
    oversoldSeries.setData(oversoldData);

    console.log(`✅ RSI calculated with ${rsiLineData.length} data points`);
  };

  const handleDoubleClick = (
    event: MouseEvent,
    chart: IChartApi,
    chartContainer: HTMLDivElement,
  ) => {
    const rect = chartContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const time = chart.timeScale().coordinateToTime(x);

    if (time) {
      if (!isSelectingRangeRef.current) {
        // First double click - start selection
        isSelectingRangeRef.current = true;
        firstClickTimeRef.current = time;
        setIsSelectingRange(true);
        setFirstClickTime(time);
        setShowPopup(false);
        setShowRangePopup(false);
      } else {
        setSelectedRangeData({
          message: 'test',
          startTime: firstClickTimeRef.current,
          endTime: time,
        });
        setShowRangePopup(true);
        setShowPopup(false);

        // Reset selection state
        isSelectingRangeRef.current = false;
        firstClickTimeRef.current = null;
        setIsSelectingRange(false);
        setFirstClickTime(null);
      }
    }
  };

  // Handle crosshair move event - moved outside useEffect
  const handleCrosshairMove = (param: any, candlestickSeries: any) => {
    // Only show single candle popup if not selecting range
    if (!isSelectingRangeRef.current) {
      if (
        param.time &&
        param.seriesData.has(candlestickSeries) &&
        param.point
      ) {
        const data = param.seriesData.get(candlestickSeries);
        if (data) {
          const candleData = {
            time: param.time,
            open: (data as any).open,
            high: (data as any).high,
            low: (data as any).low,
            close: (data as any).close,
          };

          // Set popup data and position
          setPopupData(candleData);
          setPopupPosition({
            x: param.point.x,
            y: param.point.y,
          });
          setShowPopup(true);
        } else {
          // Hide popup when hover but no candle data
          setShowPopup(false);
        }
      } else {
        // Hide popup when not hovering over chart or no crosshair
        setShowPopup(false);
      }
    }
  };

  const initChart = () => {
    if (!chartContainerRef.current) return;

    const containerWidth = (chartContainerRef.current.clientWidth || 800) - 1; // Subtract 1px for border
    const containerHeight = calculateChartHeight(); // Smart height calculation

    if (containerWidth <= 0 || containerHeight <= 0) {
      return;
    }

    const chart = createChart(chartContainerRef.current, {
      width: containerWidth,
      height: containerHeight,
      layout: {
        background: { color: '#1e222d' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2f3a' },
        horzLines: { color: '#2b2f3a' },
      },
      crosshair: {
        mode: 1,
      },
      timeScale: {
        borderColor: '#2b2f3a',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#2b2f3a',
      },
    });

    return chart;
  };

  // Fetch and load data
  const loadData = async (
    candlestickSeries: any,
    macdLineSeries?: any,
    signalLineSeries?: any,
    histogramSeries?: any,
    rsiLineSeries?: any,
    overboughtSeries?: any,
    oversoldSeries?: any,
  ) => {
    setLoading(true);
    setError(null);

    try {
      let candleData: CandleData[];

      if (useRealData) {
        // Fetch real data from your backend API
        const apiData = await fetchCoinAnalysis(symbol, timeframe);
        candleData = apiData.map((candle: Candle) => ({
          time: (typeof candle.time === 'string'
            ? candle.time
            : candle.time) as Time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));
      } else {
        // Use mock data
        candleData = generateSampleData(timeframe);
      }

      candlestickSeries.setData(candleData);

      // Calculate and display MACD if series are provided
      if (macdLineSeries && signalLineSeries && histogramSeries) {
        updateMacdData(
          candleData,
          macdLineSeries,
          signalLineSeries,
          histogramSeries,
        );
      }

      // Calculate and display RSI if series are provided
      if (rsiLineSeries && overboughtSeries && oversoldSeries) {
        updateRSIData(
          candleData,
          rsiLineSeries,
          overboughtSeries,
          oversoldSeries,
        );
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setLoading(false);

      // Fallback to mock data on error
      const fallbackData = generateSampleData(timeframe);
      candlestickSeries.setData(fallbackData);

      // Calculate MACD for fallback data too
      if (macdLineSeries && signalLineSeries && histogramSeries) {
        updateMacdData(
          fallbackData,
          macdLineSeries,
          signalLineSeries,
          histogramSeries,
        );
      }

      // Calculate RSI for fallback data too
      if (rsiLineSeries && overboughtSeries && oversoldSeries) {
        updateRSIData(
          fallbackData,
          rsiLineSeries,
          overboughtSeries,
          oversoldSeries,
        );
      }
    }
  };

  return (
    <div>
      <TradingToolbar
        onDrawingToolSelect={(tool) => console.log('Selected tool:', tool)}
        onIndicatorClick={() => console.log('Indicators clicked')}
        onCompareClick={() => console.log('Compare clicked')}
        onSettingsClick={() => console.log('Settings clicked')}
        onFullscreenClick={() => console.log('Fullscreen clicked')}
      />
      <div
        style={{
          padding: '15px 20px',
          background: '#1e222d',
          borderBottom: '1px solid #2b2f3a',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{ color: '#d1d4dc', marginRight: '10px', fontWeight: 'bold' }}
        >
          Timeframe:
        </span>
        {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: timeframe === tf ? '#f7931a' : '#2b2f3a',
              color: timeframe === tf ? '#000' : '#d1d4dc',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: timeframe === tf ? 'bold' : 'normal',
              transition: 'all 0.2s',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (timeframe !== tf && !loading) {
                e.currentTarget.style.background = '#363a45';
              }
            }}
            onMouseLeave={(e) => {
              if (timeframe !== tf) {
                e.currentTarget.style.background = '#2b2f3a';
              }
            }}
          >
            {tf.toUpperCase()}
          </button>
        ))}

        {/* Loading indicator */}
        {loading && (
          <span
            style={{
              color: '#f7931a',
              marginLeft: '10px',
              fontSize: '14px',
            }}
          >
            ⏳ Loading...
          </span>
        )}

        {/* Error indicator */}
        {error && (
          <span
            style={{
              color: '#ef5350',
              marginLeft: '10px',
              fontSize: '12px',
            }}
          >
            ⚠️ {error} (using fallback data)
          </span>
        )}
      </div>

      <div
        ref={chartContainerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: `${calculateChartHeight()}px`, // Smart dynamic height
          overflow: 'hidden', // Hide overflow content
        }}
      >
        {/* Candle Data Popup */}
        {showPopup && popupData && popupPosition && (
          <div
            style={{
              position: 'absolute',
              left: popupPosition.x + 10,
              top: popupPosition.y - 150,
              background: 'rgba(30, 34, 45, 0.95)',
              border: '1px solid #2b2f3a',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: '#d1d4dc',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              zIndex: 1000,
              minWidth: '180px',
              pointerEvents: 'none', // Cho phép hover qua popup
            }}
          >
            <div
              style={{
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#f7931a',
              }}
            >
              🕯️ Candle Data
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <div>
                <span style={{ color: '#808080' }}>Time: </span>
                <span style={{ color: '#d1d4dc' }}>
                  {typeof popupData.time === 'string'
                    ? popupData.time
                    : new Date(popupData.time * 1000).toLocaleString()}
                </span>
              </div>
              <div>
                <span style={{ color: '#808080' }}>Open: </span>
                <span style={{ color: '#d1d4dc' }}>
                  ${popupData.open?.toFixed(2)}
                </span>
              </div>
              <div>
                <span style={{ color: '#808080' }}>High: </span>
                <span style={{ color: '#26a69a' }}>
                  ${popupData.high?.toFixed(2)}
                </span>
              </div>
              <div>
                <span style={{ color: '#808080' }}>Low: </span>
                <span style={{ color: '#ef5350' }}>
                  ${popupData.low?.toFixed(2)}
                </span>
              </div>
              <div>
                <span style={{ color: '#808080' }}>Close: </span>
                <span
                  style={{
                    color:
                      popupData.close >= popupData.open ? '#26a69a' : '#ef5350',
                  }}
                >
                  ${popupData.close?.toFixed(2)}
                </span>
              </div>
              <div
                style={{
                  marginTop: '4px',
                  paddingTop: '4px',
                  borderTop: '1px solid #2b2f3a',
                }}
              >
                <span style={{ color: '#808080' }}>Change: </span>
                <span
                  style={{
                    color:
                      popupData.close >= popupData.open ? '#26a69a' : '#ef5350',
                  }}
                >
                  {popupData.close >= popupData.open ? '+' : ''}
                  {(
                    ((popupData.close - popupData.open) / popupData.open) *
                    100
                  ).toFixed(2)}
                  %
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Simple Test Popup */}
        {showRangePopup && selectedRangeData && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(30, 34, 45, 0.95)',
              border: '2px solid #f7931a',
              borderRadius: '12px',
              padding: '20px',
              fontSize: '16px',
              color: '#d1d4dc',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              zIndex: 1001,
              minWidth: '200px',
              textAlign: 'center',
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                color: '#f7931a',
                marginBottom: '10px',
              }}
            >
              🎯
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#26a69a',
                marginBottom: '10px',
              }}
            >
              {selectedRangeData.message || 'test'}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#808080',
                marginBottom: '15px',
              }}
            >
              Drag selection thành công!
            </div>
            <button
              onClick={() => setShowRangePopup(false)}
              style={{
                background: '#f7931a',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Đóng
            </button>
          </div>
        )}
      </div>

      {/* MACD Indicator Container - Conditional */}
      {showMacd && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#1e222d',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              color: '#d1d4dc',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '10px',
              paddingLeft: '10px',
            }}
          >
            📈 MACD Indicator (12, 26, 9)
          </div>
          <div
            ref={macdContainerRef}
            style={{ position: 'relative', width: '100%' }}
          />
        </div>
      )}

      {/* RSI Indicator Container - Conditional */}
      {showRSI && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#1e222d',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              color: '#d1d4dc',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '10px',
              paddingLeft: '10px',
            }}
          >
            📊 RSI Indicator (14)
          </div>
          <div
            ref={rsiContainerRef}
            style={{ position: 'relative', width: '100%' }}
          />
        </div>
      )}

      {/* <div
        style={{
          padding: '15px',
          fontSize: '14px',
          color: '#d1d4dc',
          background: '#1e222d',
          borderTop: '1px solid #2b2f3a',
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          <strong style={{ color: '#f7931a' }}>📊 {symbol}</strong> -{' '}
          {useRealData ? 'Data from Your Backend API' : 'Simulated data'} (
          {timeframe.toUpperCase()})
        </div>
        <div style={{ fontSize: '12px', color: '#808080' }}>
          💡 Hover để xem nến | 🖱️ Double click nến 1 → Double click nến 2 →
          Popup | {useRealData ? '🔴 Backend API' : '🟡 Mock Data'}
          {isSelectingRange && (
            <span
              style={{
                color: '#f7931a',
                fontWeight: 'bold',
                marginLeft: '10px',
              }}
            >
              🎯 Đã chọn nến đầu! Double click nến thứ 2!
            </span>
          )}
        </div>
      </div> */}
    </div>
  );
}

// Generate realistic BTC candle data based on timeframe
function generateSampleData(timeframe: Timeframe): CandleData[] {
  const data: CandleData[] = [];
  let currentPrice = 45000; // BTC base price ~$45k

  // Timeframe settings
  const timeframeConfig = {
    '1m': { minutes: 1, candleCount: 500, volatility: 0.001 },
    '5m': { minutes: 5, candleCount: 400, volatility: 0.003 },
    '15m': { minutes: 15, candleCount: 300, volatility: 0.005 },
    '1h': { minutes: 60, candleCount: 250, volatility: 0.01 },
    '4h': { minutes: 240, candleCount: 200, volatility: 0.02 },
    '1d': { minutes: 1440, candleCount: 180, volatility: 0.03 },
  };

  const config = timeframeConfig[timeframe];
  const startTime = new Date('2024-01-01T00:00:00Z').getTime();

  for (let i = 0; i < config.candleCount; i++) {
    // Calculate timestamp based on timeframe
    const timestamp = startTime + i * config.minutes * 60 * 1000;

    // For daily/4h use date string, for intraday use timestamp
    const time: Time = (
      timeframe === '1d'
        ? new Date(timestamp).toISOString().split('T')[0]
        : Math.floor(timestamp / 1000)
    ) as Time;

    // Simulate BTC volatility scaled by timeframe
    const volatility = config.volatility + Math.random() * config.volatility;
    const trend = (Math.random() - 0.48) * 0.01; // Slight uptrend bias

    // Open price is previous close (with small gap possible)
    const open = currentPrice * (1 + (Math.random() - 0.5) * 0.002);

    // Close with trend + random walk
    const closeChange = trend + (Math.random() - 0.5) * volatility;
    const close = open * (1 + closeChange);

    // High and low with realistic wicks
    const maxChange = Math.abs(closeChange) + volatility * 0.5;
    const high = Math.max(open, close) * (1 + Math.random() * maxChange);
    const low = Math.min(open, close) * (1 - Math.random() * maxChange);

    data.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    });

    // Update current price for next candle
    currentPrice = close;

    // Add occasional big moves (like real BTC), less frequent for shorter timeframes
    const spikeChance =
      timeframe === '1m' ? 0.01 : timeframe === '5m' ? 0.02 : 0.05;
    if (Math.random() < spikeChance) {
      currentPrice *= 1 + (Math.random() - 0.5) * 0.08; // ±8% spike
    }
  }

  return data;
}

export default CustomCandlestickChart;
