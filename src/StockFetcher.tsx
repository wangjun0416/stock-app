import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Configuration
const IS_GITHUB_PAGES = window.location.hostname.includes('github.io');
const API_BASE_URL = IS_GITHUB_PAGES 
  ? '' // Static files in same directory for GitHub Pages
  : 'http://localhost:3001'; // Local development

interface StockData {
  stockKey: string;
  stockCode: string;
  stockName: string;
  exchange: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  marketCap: number;
  updateTime: string;
  error?: string;
}

interface StockInfo {
  key: string;
  code: string;
  name: string;
  exchange: string;
}

interface HistoricalData {
  time: string;
  price: number;
  volume: number;
}

// Default stocks for static mode
const DEFAULT_STOCKS: StockInfo[] = [
  { key: '7974', code: '7974.T', name: 'Nintendo Co., Ltd.', exchange: 'Tokyo Stock Exchange' },
  { key: '4784', code: '4784.T', name: 'GREAT TOYS', exchange: 'Tokyo Stock Exchange' },
  { key: '9501', code: '9501.T', name: 'Tokyo Electric Power Company', exchange: 'Tokyo Stock Exchange' }
];

// Generate mock data for static/GitHub Pages mode
const generateMockData = (stock: StockInfo): StockData => {
  const basePrice = 7000 + Math.random() * 3000;
  const previousClose = basePrice * (0.95 + Math.random() * 0.1);
  const change = basePrice - previousClose;
  const changePercent = (change / previousClose) * 100;
  
  return {
    stockKey: stock.key,
    stockCode: stock.code,
    stockName: stock.name,
    exchange: stock.exchange,
    currentPrice: Math.round(basePrice * 100) / 100,
    previousClose: Math.round(previousClose * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    volume: Math.floor(Math.random() * 10000000),
    high: Math.round(basePrice * 1.02 * 100) / 100,
    low: Math.round(basePrice * 0.98 * 100) / 100,
    marketCap: Math.floor(Math.random() * 1000000000000),
    updateTime: new Date().toLocaleString('en-US')
  };
};

const StockFetcher: React.FC = () => {
  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>('7974');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [allStockData, setAllStockData] = useState<StockData[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'single' | 'list'>('single');
  const [isStaticMode, setIsStaticMode] = useState<boolean>(IS_GITHUB_PAGES);

  // Fetch stock list
  const fetchStockList = async () => {
    if (isStaticMode) {
      setStocks(DEFAULT_STOCKS);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/stocks`);
      if (!response.ok) {
        // Fallback to static mode if API fails
        setIsStaticMode(true);
        setStocks(DEFAULT_STOCKS);
        return;
      }
      const data = await response.json();
      setStocks(data);
    } catch (err) {
      console.error('Failed to fetch stock list:', err);
      setIsStaticMode(true);
      setStocks(DEFAULT_STOCKS);
    }
  };

  // Fetch single stock data
  const fetchStockData = async (stockKey: string, showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    const stock = stocks.find(s => s.key === stockKey) || DEFAULT_STOCKS[0];

    if (isStaticMode) {
      // Generate mock data for static mode
      const mockData = generateMockData(stock);
      
      const mockHistoricalData: HistoricalData[] = [
        { time: '09:00', price: mockData.previousClose * 0.995, volume: 100000 },
        { time: '10:00', price: mockData.previousClose * 0.998, volume: 150000 },
        { time: '11:00', price: mockData.previousClose * 1.002, volume: 200000 },
        { time: '12:00', price: mockData.previousClose * 0.999, volume: 180000 },
        { time: '13:00', price: mockData.currentPrice * 0.998, volume: 160000 },
        { time: '14:00', price: mockData.currentPrice * 1.001, volume: 170000 },
        { time: '15:00', price: mockData.currentPrice, volume: 190000 }
      ];

      setStockData(mockData);
      setHistoricalData(mockHistoricalData);
      setLastUpdate(new Date().toLocaleString('en-US'));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/stock/${stockKey}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const stockData: StockData = {
        stockKey: data.stockKey,
        stockCode: data.stockCode,
        stockName: data.stockName,
        exchange: data.exchange,
        currentPrice: Number(data.currentPrice),
        previousClose: Number(data.previousClose),
        change: Number(data.change),
        changePercent: Number(data.changePercent),
        volume: Number(data.volume),
        high: Number(data.high),
        low: Number(data.low),
        marketCap: Number(data.marketCap),
        updateTime: data.updateTime
      };
      
      const mockHistoricalData: HistoricalData[] = [
        { time: '09:00', price: data.previousClose * 0.995, volume: 100000 },
        { time: '10:00', price: data.previousClose * 0.998, volume: 150000 },
        { time: '11:00', price: data.previousClose * 1.002, volume: 200000 },
        { time: '12:00', price: data.previousClose * 0.999, volume: 180000 },
        { time: '13:00', price: data.currentPrice * 0.998, volume: 160000 },
        { time: '14:00', price: data.currentPrice * 1.001, volume: 170000 },
        { time: '15:00', price: data.currentPrice, volume: 190000 }
      ];
      
      setStockData(stockData);
      setHistoricalData(mockHistoricalData);
      setLastUpdate(new Date().toLocaleString('en-US'));
    } catch (err) {
      console.error('Failed to fetch stock data:', err);
      // Fallback to static mode
      setIsStaticMode(true);
      const mockData = generateMockData(stock);
      setStockData(mockData);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all stocks data
  const fetchAllStocks = async () => {
    if (isStaticMode) {
      const mockData = DEFAULT_STOCKS.map(generateMockData);
      setAllStockData(mockData);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/all-stocks`);
      if (!response.ok) {
        setIsStaticMode(true);
        setAllStockData(DEFAULT_STOCKS.map(generateMockData));
        return;
      }
      const data = await response.json();
      setAllStockData(data);
    } catch (err) {
      console.error('Failed to fetch all stocks:', err);
      setIsStaticMode(true);
      setAllStockData(DEFAULT_STOCKS.map(generateMockData));
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    fetchStockList();
  }, []);

  useEffect(() => {
    if (stocks.length > 0) {
      fetchStockData(selectedStock, true);
    }
  }, [selectedStock, stocks]);

  // Periodic refresh
  useEffect(() => {
    if (stocks.length === 0) return;

    const interval = setInterval(() => {
      if (viewMode === 'single') {
        fetchStockData(selectedStock, false);
      } else if (viewMode === 'list') {
        fetchAllStocks();
      }
    }, 180000); // 3 minutes

    return () => clearInterval(interval);
  }, [selectedStock, viewMode, stocks, isStaticMode]);

  // Switch stock
  const handleStockChange = (stockKey: string) => {
    setSelectedStock(stockKey);
    fetchStockData(stockKey, true);
  };

  if (loading && !stockData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Unable to load data</h1>
          <button 
            onClick={() => fetchStockData(selectedStock, true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Stock Market Monitor
          </h1>
          <p className="text-gray-400 text-lg">
            Real-time Stock Price Data
            {isStaticMode && (
              <span className="ml-2 text-xs bg-yellow-600 px-2 py-1 rounded">Demo Mode</span>
            )}
          </p>
        </div>

        {/* Navigation */}
        <div className="bg-gray-800/60 backdrop-blur rounded-2xl p-4 mb-8 border border-gray-700">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            {viewMode === 'single' && (
              <div className="flex gap-2 flex-wrap justify-center">
                {stocks.map((stock) => (
                  <button
                    key={stock.key}
                    onClick={() => handleStockChange(stock.key)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      selectedStock === stock.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {stock.code}
                  </button>
                ))}
              </div>
            )}
            
            <div className="h-8 w-px bg-gray-600 mx-2"></div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('single')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  viewMode === 'single'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Detail
              </button>
              <button
                onClick={() => { setViewMode('list'); fetchAllStocks(); }}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Detail View */}
        {viewMode === 'single' && (
          <>
            <div className="bg-gray-800/60 backdrop-blur rounded-3xl p-8 mb-8 border border-gray-700 shadow-2xl">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold mb-1">{stockData.stockName}</h2>
                <p className="text-gray-400">{stockData.stockCode} - {stockData.exchange}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-center md:text-left">
                  <p className="text-gray-400 text-sm mb-2">Current Price</p>
                  <p className="text-5xl font-bold mb-2">
                    ¥{stockData.currentPrice.toLocaleString()}
                  </p>
                  <div className={`flex items-center justify-center md:justify-start text-2xl font-semibold ${
                    stockData.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <span className="mr-2">
                      {stockData.change >= 0 ? '↑' : '↓'}
                    </span>
                    <span>
                      {stockData.change >= 0 ? '+' : ''}{stockData.change.toLocaleString()}
                    </span>
                    <span className="ml-2 text-xl">
                      ({stockData.change >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-400">Previous Close:</span>
                    <span className="font-semibold">¥{stockData.previousClose.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-400">High:</span>
                    <span className="font-semibold text-green-400">¥{stockData.high.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-400">Low:</span>
                    <span className="font-semibold text-red-400">¥{stockData.low.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-400">Volume:</span>
                    <span className="font-semibold">{(stockData.volume / 1000000).toFixed(2)}M</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                    Last Update: {lastUpdate || stockData.updateTime}
                  </p>
                  <button 
                    onClick={() => fetchStockData(selectedStock, true)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/60 backdrop-blur rounded-3xl p-8 mb-8 border border-gray-700 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">Stock Price Chart (Today)</h2>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `¥${Number(value).toLocaleString()}`} />
                  <Tooltip 
                    formatter={(value) => [`¥${Number(value).toLocaleString()}`, 'Price']}
                    labelStyle={{ color: '#fff' }}
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-gray-800/60 backdrop-blur rounded-3xl p-8 border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Stock List ({allStockData.length || stocks.length} stocks)</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-4 px-4 text-gray-400">Stock Code</th>
                    <th className="text-left py-4 px-4 text-gray-400">Stock Name</th>
                    <th className="text-right py-4 px-4 text-gray-400">Current Price</th>
                    <th className="text-right py-4 px-4 text-gray-400">Change</th>
                    <th className="text-right py-4 px-4 text-gray-400">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {(allStockData.length > 0 ? allStockData : stocks.map(generateMockData)).map((stock, index) => (
                    <tr 
                      key={stock.stockKey || `stock-${index}`} 
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer"
                      onClick={() => { 
                        const key = stock.stockKey || stocks[index]?.key || '7974'; 
                        setSelectedStock(key); 
                        setViewMode('single'); 
                      }}
                    >
                      <td className="py-4 px-4 font-medium">{stock.stockCode}</td>
                      <td className="py-4 px-4">{stock.stockName}</td>
                      <td className="py-4 px-4 text-right font-bold">
                        {stock.error ? (
                          <span className="text-red-400">Error</span>
                        ) : (
                          `¥${(stock.currentPrice || 0).toLocaleString()}`
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {!stock.error && (
                          <span className={(stock.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {(stock.change || 0) >= 0 ? '+' : ''}{(stock.change || 0).toLocaleString()}
                            <span className="text-sm ml-1">
                              ({(stock.change || 0) >= 0 ? '+' : ''}{(stock.changePercent || 0).toFixed(2)}%)
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {!stock.error && `${((stock.volume || 0) / 1000000).toFixed(2)}M`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Status bar */}
        <div className="flex items-center justify-center space-x-2 mt-8">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-sm font-medium">
            {isStaticMode ? 'Demo Mode - Auto Refresh' : 'Real-time Updates Active'}
          </span>
          <span className="text-gray-500 mx-2">|</span>
          <span className="text-gray-400 text-sm">{stocks.length} stocks</span>
        </div>

        {/* Footer note for static mode */}
        {isStaticMode && (
          <div className="mt-8 text-center">
            <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 inline-block">
              <p className="text-blue-400 text-sm">
                💡 Running in demo mode with simulated data.<br/>
                Connect to backend API for real-time data.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockFetcher;
