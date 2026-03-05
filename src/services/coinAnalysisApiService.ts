import { get, post } from './baseApiService';

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

export interface CoinAnalysisApiResponse {
  data: CoinAnalysisCandle[];
  statusCode: number;
  success: boolean;
  timestamp: string;
}

async function fetchCandleData(
  symbol: string = 'BTCUSDT',
  interval: string = '1h',
) {
  return post<any>(`/coin-analysis/fetch-and-save?token=${symbol}&time=${interval}`);
}

async function fetchCoinAnalysis(
  symbol: string = 'BTCUSDT',
  interval: string = '1h',
  limit?: number
): Promise<Candle[]> {
  try {
    const response = await get<CoinAnalysisApiResponse>('/coin-analysis');
    const apiResponse = response.data;

    // Check if API call was successful
    if (!apiResponse.success || apiResponse.statusCode !== 200) {
      throw new Error(`API returned error: ${apiResponse.statusCode}`);
    }

    let data = apiResponse.data;

    // Filter by symbol and interval
    data = data.filter(
      (candle) => candle.symbol === symbol && candle.interval === interval,
    );

    // Apply limit if specified
    if (limit && limit > 0) {
      data = data.slice(-limit); // Get the last N candles
    }

    console.log(`✅ Loaded ${data.length} candles from backend for ${symbol} ${interval}`);

    // Convert to chart format
    const candles: Candle[] = data.map((candle) => {
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
  } catch (error: any) {
    throw error;
  }
}

export {
  fetchCoinAnalysis,
  fetchCandleData,
};

