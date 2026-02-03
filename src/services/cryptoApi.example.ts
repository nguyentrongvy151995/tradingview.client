// Example usage of cryptoApi service
// Run this file with: npx ts-node src/services/cryptoApi.example.ts

import cryptoApiService from './cryptoApi';

async function testCryptoApi() {
  console.log('🚀 Testing Crypto API Service...\n');

  try {
    // 1. Fetch BTC candles (1 hour timeframe)
    console.log('📊 Fetching BTCUSDT 1h candles...');
    const candles = await cryptoApiService.fetchBinanceCandles(
      'BTCUSDT',
      '1h',
      10,
    );
    console.log(`✅ Got ${candles.length} candles`);
    console.log('First candle:', candles[0]);
    console.log('Last candle:', candles[candles.length - 1]);
    console.log('');

    // 2. Fetch current BTC price
    console.log('💰 Fetching current BTCUSDT price...');
    const currentPrice = await cryptoApiService.fetchCurrentPrice('BTCUSDT');
    console.log(`✅ Current price: $${currentPrice.toLocaleString()}`);
    console.log('');

    // 3. Fetch 24h ticker data
    console.log('📈 Fetching 24h ticker data...');
    const ticker = await cryptoApiService.fetch24hTicker('BTCUSDT');
    console.log('✅ 24h Stats:');
    console.log(
      `   Price Change: ${ticker.priceChange >= 0 ? '+' : ''}${ticker.priceChange.toFixed(2)} (${ticker.priceChangePercent.toFixed(2)}%)`,
    );
    console.log(`   High: $${ticker.highPrice.toLocaleString()}`);
    console.log(`   Low: $${ticker.lowPrice.toLocaleString()}`);
    console.log(`   Volume: ${ticker.volume.toLocaleString()} BTC`);
    console.log(`   Quote Volume: $${ticker.quoteVolume.toLocaleString()}`);
    console.log('');

    // 4. Fetch trading pairs
    console.log('🔍 Fetching USDT trading pairs...');
    const pairs = await cryptoApiService.fetchTradingPairs();
    console.log(`✅ Found ${pairs.length} USDT pairs`);
    console.log('Top 10 pairs:', pairs.slice(0, 10).join(', '));
    console.log('');

    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Uncomment to run the test
// testCryptoApi();

export default testCryptoApi;
