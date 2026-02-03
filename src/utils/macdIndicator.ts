/**
 * MACD (Moving Average Convergence Divergence) Indicator
 *
 * MACD = 12-period EMA - 26-period EMA
 * Signal Line = 9-period EMA of MACD
 * Histogram = MACD - Signal Line
 */

export interface MACDData {
  time: number | string;
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

export interface MACDConfig {
  fastPeriod?: number; // Default: 12
  slowPeriod?: number; // Default: 26
  signalPeriod?: number; // Default: 9
}

/**
 * Calculate EMA (Exponential Moving Average)
 */
function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  if (data.length === 0) return ema;

  // First EMA is just SMA
  let sum = 0;
  for (let i = 0; i < period && i < data.length; i++) {
    sum += data[i];
  }
  ema.push(sum / period);

  // Calculate remaining EMAs
  for (let i = period; i < data.length; i++) {
    const value =
      (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(value);
  }

  return ema;
}

/**
 * Calculate MACD indicator
 */
export function calculateMACD(
  closePrices: number[],
  times: (number | string)[],
  config: MACDConfig = {},
): MACDData[] {
  const { fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } = config;

  const result: MACDData[] = [];

  if (closePrices.length < slowPeriod) {
    // Not enough data, return empty with nulls
    return times.map((time) => ({
      time,
      macd: null,
      signal: null,
      histogram: null,
    }));
  }

  // Calculate fast and slow EMAs
  const fastEMA = calculateEMA(closePrices, fastPeriod);
  const slowEMA = calculateEMA(closePrices, slowPeriod);

  // Calculate MACD line (fast EMA - slow EMA)
  const macdLine: number[] = [];
  const startIndex = slowPeriod - 1;

  for (let i = 0; i < slowEMA.length; i++) {
    const macdValue = fastEMA[i + (fastPeriod - 1)] - slowEMA[i];
    macdLine.push(macdValue);
  }

  // Calculate signal line (9-period EMA of MACD)
  const signalLine = calculateEMA(macdLine, signalPeriod);

  // Build result array
  for (let i = 0; i < times.length; i++) {
    if (i < startIndex) {
      // Not enough data yet
      result.push({
        time: times[i],
        macd: null,
        signal: null,
        histogram: null,
      });
    } else {
      const macdIndex = i - startIndex;
      const macdValue = macdLine[macdIndex] || null;

      let signalValue = null;
      let histogramValue = null;

      if (
        macdIndex >= signalPeriod - 1 &&
        signalLine[macdIndex - (signalPeriod - 1)]
      ) {
        signalValue = signalLine[macdIndex - (signalPeriod - 1)];
        if (macdValue !== null) {
          histogramValue = macdValue - signalValue;
        }
      }

      result.push({
        time: times[i],
        macd: macdValue,
        signal: signalValue,
        histogram: histogramValue,
      });
    }
  }

  return result;
}

/**
 * Generate mock MACD data (for testing without API)
 */
export function generateMockMACDData(
  closePrices: number[],
  times: (number | string)[],
): MACDData[] {
  return calculateMACD(closePrices, times, {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
  });
}
