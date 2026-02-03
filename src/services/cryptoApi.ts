// Crypto API Service - Support multiple exchanges
// Binance API documentation: https://binance-docs.github.io/apidocs/spot/en/

export interface Candle {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TimeframeAPI = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

// Binance timeframe mapping
const binanceIntervalMap: Record<TimeframeAPI, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
};

/**
 * Fetch candle data from Binance API
 * @param symbol - Trading pair (e.g., BTCUSDT)
 * @param interval - Timeframe (1m, 5m, 15m, 1h, 4h, 1d)
 * @param limit - Number of candles to fetch (max 1000)
 */
export async function fetchBinanceCandles(
  symbol: string = 'BTCUSDT',
  interval: TimeframeAPI = '1h',
  limit: number = 500,
): Promise<Candle[]> {
  try {
    const binanceInterval = binanceIntervalMap[interval];
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Binance API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Binance klines format:
    // [
    //   [
    //     1499040000000,      // 0: Open time
    //     "0.01634000",       // 1: Open
    //     "0.80000000",       // 2: High
    //     "0.01575800",       // 3: Low
    //     "0.01577100",       // 4: Close
    //     "148976.11427815",  // 5: Volume
    //     1499644799999,      // 6: Close time
    //     "2434.19055334",    // 7: Quote asset volume
    //     308,                // 8: Number of trades
    //     "1756.87402397",    // 9: Taker buy base asset volume
    //     "28.46694368",      // 10: Taker buy quote asset volume
    //     "17928899.62484339" // 11: Ignore
    //   ]
    // ]

    const candles: Candle[] = data.map((kline: any) => {
      const timestamp = kline[0]; // Open time in milliseconds
      const time =
        interval === '1d'
          ? new Date(timestamp).toISOString().split('T')[0] // YYYY-MM-DD for daily
          : Math.floor(timestamp / 1000); // Unix timestamp in seconds for intraday

      return {
        time,
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
      };
    });

    return candles;
  } catch (error) {
    console.error('❌ Error fetching Binance candles:', error);
    throw error;
  }
}

/**
 * Fetch current BTC price from Binance
 */
export async function fetchCurrentPrice(
  symbol: string = 'BTCUSDT',
): Promise<number> {
  try {
    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error('❌ Error fetching current price:', error);
    throw error;
  }
}

/**
 * Fetch 24h ticker data (price change, volume, etc.)
 */
export async function fetch24hTicker(symbol: string = 'BTCUSDT') {
  try {
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      symbol: data.symbol,
      priceChange: parseFloat(data.priceChange),
      priceChangePercent: parseFloat(data.priceChangePercent),
      lastPrice: parseFloat(data.lastPrice),
      volume: parseFloat(data.volume),
      quoteVolume: parseFloat(data.quoteVolume),
      highPrice: parseFloat(data.highPrice),
      lowPrice: parseFloat(data.lowPrice),
      openPrice: parseFloat(data.openPrice),
      closePrice: parseFloat(data.lastPrice),
    };
  } catch (error) {
    console.error('❌ Error fetching 24h ticker:', error);
    throw error;
  }
}

/**
 * Get list of available trading pairs on Binance
 */
export async function fetchTradingPairs(): Promise<string[]> {
  try {
    const url = 'https://api.binance.com/api/v3/exchangeInfo';
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();
    const pairs = data.symbols
      .filter((s: any) => s.status === 'TRADING' && s.quoteAsset === 'USDT')
      .map((s: any) => s.symbol);

    return pairs;
  } catch (error) {
    console.error('❌ Error fetching trading pairs:', error);
    throw error;
  }
}

// Export a default service object
const cryptoApiService = {
  fetchBinanceCandles,
  fetchCurrentPrice,
  fetch24hTicker,
  fetchTradingPairs,
};

export default cryptoApiService;
