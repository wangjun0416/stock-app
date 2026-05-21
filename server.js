const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Default stocks - can be modified dynamically
let STOCKS = {
  '7974': {
    code: '7974.T',
    name: 'Nintendo Co., Ltd.',
    exchange: 'Tokyo Stock Exchange'
  },
  '4784': {
    code: '4784.T',
    name: 'GREAT TOYS',
    exchange: 'Tokyo Stock Exchange'
  },
  '9501': {
    code: '9501.T',
    name: 'Tokyo Electric Power Company',
    exchange: 'Tokyo Stock Exchange'
  }
};

// Price alert storage
let priceAlerts = [];
let triggeredAlerts = [];

// Helper function to get stock info from Yahoo Finance
async function getStockInfoFromYahoo(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 5000
    });

    if (response.data && response.data.chart && response.data.chart.result && response.data.chart.result[0]) {
      const result = response.data.chart.result[0];
      const meta = result.meta;
      
      // Extract stock name from symbol or meta
      let stockName = meta.shortName || meta.longName || meta.symbol;
      let exchange = meta.exchangeName || meta.fullExchangeName || 'Unknown Exchange';
      
      // Clean up the symbol (remove .T suffix for key)
      const cleanSymbol = symbol.replace(/\.T$/, '').replace(/\.JP$/, '');
      
      return {
        valid: true,
        symbol: symbol,
        cleanSymbol: cleanSymbol,
        name: stockName,
        exchange: exchange,
        currency: meta.currency || 'JPY'
      };
    }
    return { valid: false, error: 'Invalid response from Yahoo Finance' };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Fetch single stock data
async function fetchStockData(stockKey) {
  const stock = STOCKS[stockKey];
  if (!stock) {
    throw new Error(`Unknown stock code: ${stockKey}`);
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${stock.code}`;
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive'
    },
    timeout: 5000
  });

  if (!response.data || !response.data.chart || !response.data.chart.result || !response.data.chart.result[0]) {
    throw new Error(`Invalid response format for ${stock.code}`);
  }

  const chartData = response.data.chart.result[0];
  const meta = chartData.meta;
  const previousClose = meta.previousClose;
  const currentPrice = meta.regularMarketPrice || meta.currentPrice || previousClose;
  const volume = meta.volume || meta.regularMarketVolume || 0;
  const high = meta.regularMarketDayHigh || currentPrice;
  const low = meta.regularMarketDayLow || currentPrice;
  const marketCap = meta.marketCap || 0;
  
  const change = currentPrice - previousClose;
  const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

  return {
    stockKey: stockKey,
    stockCode: stock.code,
    stockName: stock.name,
    exchange: stock.exchange,
    currentPrice: currentPrice,
    previousClose: previousClose,
    change: change,
    changePercent: changePercent,
    volume: volume,
    high: high,
    low: low,
    marketCap: marketCap,
    updateTime: new Date().toLocaleString('en-US')
  };
}

// Check price alerts
async function checkPriceAlerts() {
  console.log('🔔 Checking price alerts...');
  
  for (const alert of priceAlerts) {
    if (triggeredAlerts.includes(alert.id)) continue;
    
    try {
      const stockData = await fetchStockData(alert.stockKey);
      const currentPrice = stockData.currentPrice;
      
      let triggered = false;
      let message = '';
      
      if (alert.type === 'above' && currentPrice >= alert.targetPrice) {
        triggered = true;
        message = `${stockData.stockName} (${stockData.stockCode}) price has risen to ¥${currentPrice.toLocaleString()}, exceeding the target price of ¥${alert.targetPrice.toLocaleString()}`;
      } else if (alert.type === 'below' && currentPrice <= alert.targetPrice) {
        triggered = true;
        message = `${stockData.stockName} (${stockData.stockCode}) price has fallen to ¥${currentPrice.toLocaleString()}, below the target price of ¥${alert.targetPrice.toLocaleString()}`;
      }
      
      if (triggered) {
        console.log(`🚨 Price alert triggered: ${message}`);
        triggeredAlerts.push(alert.id);
        alert.triggeredAt = new Date().toISOString();
        alert.triggeredPrice = currentPrice;
      }
    } catch (error) {
      console.error(`Failed to check price for stock ${alert.stockKey}:`, error.message);
    }
  }
}

// Check price alerts every 3 minutes
setInterval(checkPriceAlerts, 180000);

// ========== Stock Management API ==========

// Add new stock
app.post('/api/stocks', async (req, res) => {
  const { symbol, name } = req.body;
  
  if (!symbol) {
    return res.status(400).json({ error: 'Stock symbol is required' });
  }
  
  // Format symbol (add .T suffix for Tokyo stocks if not present)
  let formattedSymbol = symbol.toUpperCase().trim();
  if (!formattedSymbol.includes('.')) {
    formattedSymbol += '.T';
  }
  
  // Check if stock already exists
  const existingKey = Object.keys(STOCKS).find(key => STOCKS[key].code === formattedSymbol);
  if (existingKey) {
    return res.status(400).json({ error: 'Stock already exists', stock: STOCKS[existingKey] });
  }
  
  try {
    // Validate stock by fetching from Yahoo Finance
    const stockInfo = await getStockInfoFromYahoo(formattedSymbol);
    
    if (!stockInfo.valid) {
      return res.status(400).json({ error: 'Invalid stock symbol or unable to fetch data', details: stockInfo.error });
    }
    
    // Create new stock entry
    const stockKey = stockInfo.cleanSymbol;
    const newStock = {
      code: formattedSymbol,
      name: name || stockInfo.name,
      exchange: stockInfo.exchange
    };
    
    STOCKS[stockKey] = newStock;
    
    console.log(`✅ Added new stock: ${newStock.name} (${newStock.code})`);
    
    res.status(201).json({
      message: 'Stock added successfully',
      stock: { key: stockKey, ...newStock }
    });
  } catch (error) {
    console.error('Error adding stock:', error.message);
    res.status(500).json({ error: 'Failed to add stock', message: error.message });
  }
});

// Delete stock
app.delete('/api/stocks/:key', (req, res) => {
  const { key } = req.params;
  
  if (!STOCKS[key]) {
    return res.status(404).json({ error: 'Stock not found' });
  }
  
  const deletedStock = STOCKS[key];
  delete STOCKS[key];
  
  // Also delete related alerts
  priceAlerts = priceAlerts.filter(alert => alert.stockKey !== key);
  
  console.log(`🗑️  Deleted stock: ${deletedStock.name} (${deletedStock.code})`);
  
  res.json({ message: 'Stock deleted successfully', stock: deletedStock });
});

// Get all stocks
app.get('/api/stocks', (req, res) => {
  res.json(Object.keys(STOCKS).map(key => ({
    key: key,
    code: STOCKS[key].code,
    name: STOCKS[key].name,
    exchange: STOCKS[key].exchange
  })));
});

// Get single stock data
app.get('/api/stock/:stockKey', async (req, res) => {
  const { stockKey } = req.params;
  
  try {
    console.log(`🌐 Fetching stock ${stockKey} data from Yahoo Finance...`);
    const stockData = await fetchStockData(stockKey);
    console.log('✅ Data fetched successfully:', stockData);
    res.json(stockData);
  } catch (error) {
    console.error(`❌ Failed to fetch stock ${stockKey}:`, error.message);
    res.status(500).json({
      error: 'Failed to fetch stock data',
      message: error.message
    });
  }
});

// Get all stock data
app.get('/api/all-stocks', async (req, res) => {
  try {
    console.log('🌐 Fetching all stock data from Yahoo Finance...');
    
    const promises = Object.keys(STOCKS).map(key => 
      fetchStockData(key).catch(err => ({
        stockKey: key,
        error: err.message,
        stockCode: STOCKS[key].code,
        stockName: STOCKS[key].name
      }))
    );
    
    const results = await Promise.all(promises);
    console.log('✅ All stock data fetched successfully');
    res.json(results);
  } catch (error) {
    console.error('❌ Failed to fetch:', error.message);
    res.status(500).json({
      error: 'Failed to fetch stock data',
      message: error.message
    });
  }
});

// Search stocks (validate if a symbol exists)
app.get('/api/stocks/search/:symbol', async (req, res) => {
  const { symbol } = req.params;
  let formattedSymbol = symbol.toUpperCase().trim();
  
  if (!formattedSymbol.includes('.')) {
    formattedSymbol += '.T';
  }
  
  try {
    const stockInfo = await getStockInfoFromYahoo(formattedSymbol);
    res.json(stockInfo);
  } catch (error) {
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

// ========== Price Alert API ==========

app.get('/api/alerts', (req, res) => {
  res.json(priceAlerts);
});

app.get('/api/alerts/triggered', (req, res) => {
  const triggered = priceAlerts.filter(alert => triggeredAlerts.includes(alert.id));
  res.json(triggered);
});

app.post('/api/alerts', (req, res) => {
  const { stockKey, targetPrice, type, note } = req.body;
  
  if (!STOCKS[stockKey]) {
    return res.status(400).json({ error: 'Invalid stock code' });
  }
  
  if (!targetPrice || isNaN(targetPrice)) {
    return res.status(400).json({ error: 'Invalid target price' });
  }
  
  if (!type || (type !== 'above' && type !== 'below')) {
    return res.status(400).json({ error: 'Invalid alert type (above/below)' });
  }
  
  const alert = {
    id: Date.now().toString(),
    stockKey,
    targetPrice: Number(targetPrice),
    type,
    note: note || '',
    createdAt: new Date().toISOString(),
    stockName: STOCKS[stockKey].name,
    stockCode: STOCKS[stockKey].code
  };
  
  priceAlerts.push(alert);
  console.log(`✅ Price alert created: ${alert.stockName} ${type === 'above' ? '≥' : '≤'} ¥${targetPrice}`);
  
  res.status(201).json(alert);
});

app.delete('/api/alerts/:id', (req, res) => {
  const { id } = req.params;
  const index = priceAlerts.findIndex(alert => alert.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  
  priceAlerts.splice(index, 1);
  
  const triggeredIndex = triggeredAlerts.indexOf(id);
  if (triggeredIndex > -1) {
    triggeredAlerts.splice(triggeredIndex, 1);
  }
  
  res.json({ message: 'Alert deleted' });
});

app.post('/api/alerts/reset', (req, res) => {
  triggeredAlerts = [];
  priceAlerts.forEach(alert => {
    delete alert.triggeredAt;
    delete alert.triggeredPrice;
  });
  res.json({ message: 'All alert statuses reset' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Proxy server running normally',
    activeAlerts: priceAlerts.length,
    triggeredAlerts: triggeredAlerts.length,
    totalStocks: Object.keys(STOCKS).length
  });
});

// Legacy endpoint
app.get('/api/nintendo-stock', async (req, res) => {
  try {
    console.log('🌐 Fetching Nintendo stock data from Yahoo Finance...');
    const stockData = await fetchStockData('7974');
    console.log('✅ Data fetched successfully:', stockData);
    res.json(stockData);
  } catch (error) {
    console.error('❌ Failed to fetch:', error.message);
    res.status(500).json({
      error: 'Failed to fetch stock data',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy server running at http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   - GET  /api/stocks              Get stock list`);
  console.log(`   - POST /api/stocks              Add new stock`);
  console.log(`   - DELETE /api/stocks/:key       Delete stock`);
  console.log(`   - GET  /api/stocks/search/:symbol  Search/validate stock`);
  console.log(`   - GET  /api/stock/:code         Get single stock`);
  console.log(`   - GET  /api/all-stocks          Get all stocks`);
  console.log(`   - GET  /api/alerts              Get price alerts`);
  console.log(`   - POST /api/alerts              Create price alert`);
  console.log(`   - DELETE /api/alerts/:id        Delete price alert`);
  console.log(`   - GET  /api/alerts/triggered    Get triggered alerts`);
  console.log(`🔔 Price monitoring started, checking every 3 minutes`);
});
