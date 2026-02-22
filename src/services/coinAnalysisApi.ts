// Coin Analysis API Service - Call your backend API
// API endpoint: http://localhost:3003/coin-analysis

export interface CoinAnalysisCandle {
  _id: string;
  symbol: string;
  interval: string;
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  assetVolume: string;
  trades: number;
  buyBaseVolume: string;
  buyAssetVolume: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Candle {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ApiResponse {
  data: CoinAnalysisCandle[];
  statusCode: number;
  success: boolean;
  timestamp: string;
}

const API_BASE_URL = 'http://localhost:3003';

/**
 * Fetch coin analysis data from your backend API
 * @param symbol - Trading pair (e.g., BTCUSDT)
 * @param interval - Timeframe (1h, 4h, 1d, etc.)
 * @returns Array of candles
 */
export async function fetchCoinAnalysis(
  symbol: string = 'BTCUSDT',
  interval: string = '1h',
): Promise<Candle[]> {
  try {
    const url = `${API_BASE_URL}/coin-analysis`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const apiResponse: ApiResponse = await response.json();

    // Check if API call was successful
    if (!apiResponse.success || apiResponse.statusCode !== 200) {
      throw new Error(`API returned error: ${apiResponse.statusCode}`);
    }

    const data = apiResponse.data;

    // Filter by symbol and interval if needed
    const filteredData = data.filter(
      (candle) => candle.symbol === symbol && candle.interval === interval,
    );

    console.log(`✅ Loaded ${filteredData.length} candles from backend`);

    // Convert to chart format
    const candles: Candle[] = filteredData.map((candle) => {
      // Use openTime for timestamp (in milliseconds)
      const timestamp = candle.openTime;

      // For daily charts use date string, for intraday use timestamp
      const time =
        interval === '1d'
          ? new Date(timestamp).toISOString().split('T')[0] // YYYY-MM-DD
          : Math.floor(timestamp / 1000); // Unix timestamp in seconds

      return {
        time,
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseFloat(candle.volume),
      };
    });

    // Sort by time ascending (oldest first)
    candles.sort((a, b) => {
      const timeA =
        typeof a.time === 'string' ? new Date(a.time).getTime() : a.time;
      const timeB =
        typeof b.time === 'string' ? new Date(b.time).getTime() : b.time;
      return timeA - timeB;
    });

    return candles;
  } catch (error) {
    console.error('❌ Error fetching coin analysis:', error);
    throw error;
  }
}

/**
 * Get available symbols from the API
 */
export async function getAvailableSymbols(): Promise<string[]> {
  try {
    const url = `${API_BASE_URL}/coin-analysis`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const apiResponse: ApiResponse = await response.json();

    if (!apiResponse.success || apiResponse.statusCode !== 200) {
      throw new Error(`API returned error: ${apiResponse.statusCode}`);
    }

    const data = apiResponse.data;

    // Extract unique symbols
    const symbols = Array.from(new Set(data.map((candle) => candle.symbol)));

    return symbols;
  } catch (error) {
    console.error('❌ Error fetching symbols:', error);
    throw error;
  }
}

/**
 * Get available intervals from the API
 */
export async function getAvailableIntervals(): Promise<string[]> {
  try {
    const url = `${API_BASE_URL}/coin-analysis`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const apiResponse: ApiResponse = await response.json();

    if (!apiResponse.success || apiResponse.statusCode !== 200) {
      throw new Error(`API returned error: ${apiResponse.statusCode}`);
    }

    const data = apiResponse.data;

    // Extract unique intervals
    const intervals = Array.from(new Set(data.map((candle) => candle.interval)));

    return intervals;
  } catch (error) {
    console.error('❌ Error fetching intervals:', error);
    throw error;
  }
}

/**
 * Get latest candle for a symbol
 */
export async function getLatestCandle(
  symbol: string = 'BTCUSDT',
  interval: string = '1h',
): Promise<Candle | null> {
  try {
    const candles = await fetchCoinAnalysis(symbol, interval);

    if (candles.length === 0) {
      return null;
    }

    // Return the last candle (most recent)
    return candles[candles.length - 1];
  } catch (error) {
    console.error('❌ Error fetching latest candle:', error);
    throw error;
  }
}

// Export default service object
const coinAnalysisApiService = {
  fetchCoinAnalysis,
  getAvailableSymbols,
  getAvailableIntervals,
  getLatestCandle,
};

export default coinAnalysisApiService;
