import { get } from './baseApiService';

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

/**
 * Fetch coin analysis data from backend API
 * @param symbol - Trading pair (e.g., BTCUSDT)
 * @param interval - Timeframe (1h, 4h, 1d, etc.)
 * @param limit - Maximum number of candles to return
 * @returns Array of candles
 */
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
    console.error('❌ Error fetching coin analysis:', error.message || error);
    throw error;
  }
}

/**
 * Get available symbols from the API
 */
// async function getAvailableSymbolsData(): Promise<string[]> {
//   try {
//     const response = await get<CoinAnalysisApiResponse>('/coin-analysis');
//     const apiResponse = response.data;

//     if (!apiResponse.success || apiResponse.statusCode !== 200) {
//       throw new Error(`API returned error: ${apiResponse.statusCode}`);
//     }

//     const data = apiResponse.data;

//     // Extract unique symbols
//     const symbols = Array.from(new Set(data.map((candle) => candle.symbol)));

//     console.log(`✅ Found ${symbols.length} available symbols`);
//     return symbols.sort(); // Return sorted list
//   } catch (error: any) {
//     console.error('❌ Error fetching symbols:', error.message || error);
//     throw error;
//   }
// }

/**
 * Get available intervals from the API
 */
// async function getAvailableIntervalsData(): Promise<string[]> {
//   try {
//     const response = await get<CoinAnalysisApiResponse>('/coin-analysis');
//     const apiResponse = response.data;

//     if (!apiResponse.success || apiResponse.statusCode !== 200) {
//       throw new Error(`API returned error: ${apiResponse.statusCode}`);
//     }

//     const data = apiResponse.data;

//     // Extract unique intervals
//     const intervals = Array.from(new Set(data.map((candle) => candle.interval)));

//     console.log(`✅ Found ${intervals.length} available intervals`);
//     return intervals.sort(); // Return sorted list
//   } catch (error: any) {
//     console.error('❌ Error fetching intervals:', error.message || error);
//     throw error;
//   }
// }

/**
 * Get latest candle for a symbol
 */
// async function getLatestCandleData(
//   symbol: string = 'BTCUSDT',
//   interval: string = '1h',
// ): Promise<Candle | null> {
//   try {
//     const candles = await fetchCoinAnalysisData(symbol, interval, 1);

//     if (candles.length === 0) {
//       console.log(`⚠️ No candles found for ${symbol} ${interval}`);
//       return null;
//     }

//     // Return the last candle (most recent)
//     const latestCandle = candles[candles.length - 1];
//     console.log(`✅ Latest candle for ${symbol} ${interval}:`, latestCandle);
//     return latestCandle;
//   } catch (error: any) {
//     console.error('❌ Error fetching latest candle:', error.message || error);
//     throw error;
//   }
// }

/**
 * Get candles in a specific date range
 */
// async function getCandlesInRangeData(
//   symbol: string,
//   interval: string,
//   startTime: number,
//   endTime: number
// ): Promise<Candle[]> {
//   try {
//     const allCandles = await fetchCoinAnalysisData(symbol, interval);
    
//     // Filter candles within the date range
//     const filteredCandles = allCandles.filter(candle => {
//       const candleTime = typeof candle.time === 'string' 
//         ? new Date(candle.time).getTime() 
//         : candle.time * 1000; // Convert to milliseconds if it's a timestamp
        
//       return candleTime >= startTime && candleTime <= endTime;
//     });

//     console.log(`✅ Found ${filteredCandles.length} candles in range for ${symbol} ${interval}`);
//     return filteredCandles;
//   } catch (error: any) {
//     console.error('❌ Error fetching candles in range:', error.message || error);
//     throw error;
//   }
// }

/**
 * Get market summary for multiple symbols
 */
// async function getMarketSummaryData(symbols: string[], interval: string = '1h'): Promise<Record<string, Candle | null>> {
//   try {
//     const summary: Record<string, Candle | null> = {};
    
//     // Fetch latest candles for all symbols concurrently
//     const promises = symbols.map(async (symbol) => {
//       try {
//         const latestCandle = await getLatestCandleData(symbol, interval);
//         return { symbol, candle: latestCandle };
//       } catch (error) {
//         console.warn(`Failed to fetch data for ${symbol}:`, error);
//         return { symbol, candle: null };
//       }
//     });

//     const results = await Promise.allSettled(promises);
    
//     results.forEach((result) => {
//       if (result.status === 'fulfilled') {
//         summary[result.value.symbol] = result.value.candle;
//       }
//     });

//     console.log(`✅ Market summary loaded for ${Object.keys(summary).length} symbols`);
//     return summary;
//   } catch (error: any) {
//     console.error('❌ Error fetching market summary:', error.message || error);
//     throw error;
//   }
// }

// Export functions for backward compatibility
// export const fetchCoinAnalysis = (symbol?: string, interval?: string, limit?: number) =>
//   fetchCoinAnalysisData(symbol, interval, limit);

// export const getAvailableSymbols = () =>
//   getAvailableSymbolsData();

// export const getAvailableIntervals = () =>
//   getAvailableIntervalsData();

// export const getLatestCandle = (symbol?: string, interval?: string) =>
//   getLatestCandleData(symbol, interval);

// // Export new functions
// export const getCandlesInRange = (symbol: string, interval: string, startTime: number, endTime: number) =>
//   getCandlesInRangeData(symbol, interval, startTime, endTime);

// export const getMarketSummary = (symbols: string[], interval?: string) =>
//   getMarketSummaryData(symbols, interval);

// Export the core functions directly
export {
  fetchCoinAnalysis,
  // getAvailableSymbolsData,
  // getAvailableIntervalsData,
  // getLatestCandleData,
  // getCandlesInRangeData,
  // getMarketSummaryData,
};

// Export default service object (maintains backward compatibility)
// const coinAnalysisApiService = {
//   fetchCoinAnalysis: fetchCoinAnalysisData,
//   getAvailableSymbols: getAvailableSymbolsData,
//   getAvailableIntervals: getAvailableIntervalsData,
//   getLatestCandle: getLatestCandleData,
//   getCandlesInRange: getCandlesInRangeData,
//   getMarketSummary: getMarketSummaryData,
// };

// export default coinAnalysisApiService;
