// RSI Indicator Calculation
export interface RSIDataPoint {
  time: string | number;
  rsi: number | null;
}

export function calculateRSI(
  closePrices: number[],
  times: (string | number)[],
  period: number = 14
): RSIDataPoint[] {
  const rsiData: RSIDataPoint[] = [];

  if (closePrices.length < period + 1) {
    // Not enough data, return null values
    return times.map(time => ({ time, rsi: null }));
  }

  // Calculate price changes
  const priceChanges: number[] = [];
  for (let i = 1; i < closePrices.length; i++) {
    priceChanges.push(closePrices[i] - closePrices[i - 1]);
  }

  // Calculate initial average gains and losses
  let avgGain = 0;
  let avgLoss = 0;
  
  for (let i = 0; i < period; i++) {
    const change = priceChanges[i];
    if (change > 0) {
      avgGain += change;
    } else {
      avgLoss += Math.abs(change);
    }
  }
  
  avgGain = avgGain / period;
  avgLoss = avgLoss / period;

  // Add null values for the first 'period' data points
  for (let i = 0; i < period; i++) {
    rsiData.push({ time: times[i], rsi: null });
  }

  // Calculate RSI for remaining data points
  for (let i = period; i < closePrices.length; i++) {
    const change = priceChanges[i - 1];
    
    // Update running averages using Wilder's smoothing
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }

    // Calculate RS and RSI
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    rsiData.push({ 
      time: times[i], 
      rsi: Math.round(rsi * 100) / 100 // Round to 2 decimal places
    });
  }

  return rsiData;
}