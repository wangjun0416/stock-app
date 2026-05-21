import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

interface PriceAlert {
  id: string;
  stockKey: string;
  targetPrice: number;
  type: 'above' | 'below';
  note: string;
  createdAt: string;
  stockName: string;
  stockCode: string;
  triggeredAt?: string;
  triggeredPrice?: number;
}

interface HistoricalData {
  time: string;
  price: number;
  volume: number;
}

const StockFetcher: React.FC = () => {
  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [allStockData, setAllStockData] = useState<StockData[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'single' | 'list' | 'alerts' | 'manage'>('single');
  
  // Price alert states
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<PriceAlert[]>([]);
  const [newAlertPrice, setNewAlertPrice] = useState<string>('');
  const [newAlertType, setNewAlertType] = useState<'above' | 'below'>('above');
  const [newAlertNote, setNewAlertNote] = useState<string>('');
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(false);

  // Stock management states
  const [newStockSymbol, setNewStockSymbol] = useState<string>('');
  const [newStockName, setNewStockName] = useState<string>('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState<boolean>(false);

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Your browser does not support notifications');
      return;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationEnabled(true);
      new Notification('Stock Monitor', {
        body: 'Notifications enabled! You will receive alerts when stock prices reach your targets.',
        icon: '/favicon.ico'
      });
    } else {
      alert('Please allow notification permission to receive price alerts');
    }
  };

  // Send browser notification
  const sendNotification = (title: string, body: string) => {
    if (notificationEnabled && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        tag: 'stock-alert',
        requireInteraction: true
      });
    }
  };

  // Get stock list
  const fetchStockList = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/stocks');
      if (!response.ok) throw new Error('Failed to fetch stock list');
      const data = await response.json();
      setStocks(data);
      if (data.length > 0 && !selectedStock) {
        setSelectedStock(data[0].key);
      }
    } catch (err) {
      console.error('Failed to fetch stock list:', err);
    }
  };

  // Get single stock data
  const fetchStockData = async (stockKey: string, showLoading = true) => {
    try {
      setError(null);
      if (showLoading) setLoading(true);
      
      const response = await fetch(`http://localhost:3001/api/stock/${stockKey}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.currentPrice === undefined || data.currentPrice === null) {
        throw new Error('Invalid data: currentPrice is missing');
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
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to fetch stock data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get all stock data
  const fetchAllStocks = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/all-stocks');
      if (!response.ok) throw new Error('Failed to fetch all stocks');
      const data = await response.json();
      setAllStockData(data);
    } catch (err) {
      console.error('Failed to fetch all stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get price alerts
  const fetchAlerts = async () => {
    try {
      const [alertsRes, triggeredRes] = await Promise.all([
        fetch('http://localhost:3001/api/alerts'),
        fetch('http://localhost:3001/api/alerts/triggered')
      ]);
      
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData);
      }
      
      if (triggeredRes.ok) {
        const triggeredData = await triggeredRes.json();
        
        const newTriggered = triggeredData.filter(
          (newAlert: PriceAlert) => !triggeredAlerts.some(oldAlert => oldAlert.id === newAlert.id)
        );
        
        newTriggered.forEach((alert: PriceAlert) => {
          const typeText = alert.type === 'above' ? 'risen above' : 'fallen below';
          sendNotification(
            '🔔 Stock Price Alert',
            `${alert.stockName} price has ${typeText} ¥${alert.targetPrice.toLocaleString()}! Current price: ¥${alert.triggeredPrice?.toLocaleString()}`
          );
        });
        
        setTriggeredAlerts(triggeredData);
      }
    } catch (err) {
      console.error('Failed to fetch price alerts:', err);
    }
  };

  // Search stock
  const searchStock = async () => {
    if (!newStockSymbol.trim()) {
      alert('Please enter a stock symbol');
      return;
    }
    
    setSearching(true);
    setSearchResult(null);
    
    try {
      const response = await fetch(`http://localhost:3001/api/stocks/search/${newStockSymbol.trim()}`);
      const data = await response.json();
      setSearchResult(data);
      
      if (data.valid) {
        setNewStockName(data.name);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResult({ valid: false, error: 'Search failed' });
    } finally {
      setSearching(false);
    }
  };

  // Add new stock
  const addStock = async () => {
    if (!newStockSymbol.trim()) {
      alert('Please enter a stock symbol');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3001/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newStockSymbol.trim(),
          name: newStockName.trim() || undefined
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Stock "${data.stock.name}" added successfully!`);
        setNewStockSymbol('');
        setNewStockName('');
        setSearchResult(null);
        fetchStockList();
      } else {
        alert('Failed to add stock: ' + data.error);
      }
    } catch (err) {
      console.error('Failed to add stock:', err);
      alert('Failed to add stock');
    }
  };

  // Delete stock
  const deleteStock = async (key: string) => {
    if (!window.confirm('Are you sure you want to delete this stock?')) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/stocks/${key}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchStockList();
        if (selectedStock === key && stocks.length > 1) {
          const remainingStocks = stocks.filter(s => s.key !== key);
          if (remainingStocks.length > 0) {
            setSelectedStock(remainingStocks[0].key);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete stock:', err);
    }
  };

  // Create price alert
  const createAlert = async () => {
    if (!newAlertPrice || isNaN(Number(newAlertPrice))) {
      alert('Please enter a valid target price');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3001/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockKey: selectedStock,
          targetPrice: Number(newAlertPrice),
          type: newAlertType,
          note: newAlertNote
        })
      });
      
      if (response.ok) {
        const newAlert = await response.json();
        setAlerts([...alerts, newAlert]);
        setNewAlertPrice('');
        setNewAlertNote('');
        alert('Price alert created successfully!');
      } else {
        const error = await response.json();
        alert('Failed to create alert: ' + error.error);
      }
    } catch (err) {
      console.error('Failed to create alert:', err);
      alert('Failed to create alert');
    }
  };

  // Delete price alert
  const deleteAlert = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/alerts/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setAlerts(alerts.filter(alert => alert.id !== id));
        setTriggeredAlerts(triggeredAlerts.filter(alert => alert.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  };

  // Initialize
  useEffect(() => {
    fetchStockList();
    
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationEnabled(true);
    }
  }, []);

  // Fetch data when selected stock changes
  useEffect(() => {
    if (selectedStock) {
      fetchStockData(selectedStock, true);
    }
  }, [selectedStock]);

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (viewMode === 'single' && selectedStock) {
        fetchStockData(selectedStock, false);
      } else if (viewMode === 'list') {
        fetchAllStocks();
      }
      fetchAlerts();
    }, 180000);
    
    return () => clearInterval(interval);
  }, [selectedStock, viewMode]);

  // Switch stock
  const handleStockChange = (stockKey: string) => {
    setSelectedStock(stockKey);
    fetchStockData(stockKey, true);
  };

  if (loading && !stockData && stocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-center">Loading stock data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="bg-red-900/50 backdrop-blur rounded-2xl p-8 border border-red-700 max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button 
            onClick={() => fetchStockData(selectedStock, true)}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
        <div className="max-w-6xl mx-auto text-center py-20">
          <h1 className="text-4xl font-bold mb-4">No Stocks Added</h1>
          <p className="text-gray-400 mb-8">Add some stocks to start monitoring</p>
          <button
            onClick={() => setViewMode('manage')}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Add Stocks
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
          <p className="text-gray-400 text-lg">Real-time Stock Price Data</p>
        </div>

        {/* Notification permission button */}
        {!notificationEnabled && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 mb-6 text-center">
            <p className="text-yellow-400 mb-3">Enable browser notifications to receive price alerts</p>
            <button
              onClick={requestNotificationPermission}
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-xl transition-colors"
            >
              Enable Notifications
            </button>
          </div>
        )}

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
              <button
                onClick={() => { setViewMode('alerts'); fetchAlerts(); }}
                className={`px-4 py-2 rounded-xl font-medium transition-all relative ${
                  viewMode === 'alerts'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Alerts
                {triggeredAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {triggeredAlerts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setViewMode('manage')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  viewMode === 'manage'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Manage
              </button>
            </div>
          </div>
        </div>

        {/* Detail View */}
        {viewMode === 'single' && stockData && (
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
            <h2 className="text-2xl font-bold mb-6">Stock List ({allStockData.length} stocks)</h2>
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
                  {allStockData.map((stock) => (
                    <tr 
                      key={stock.stockKey} 
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer"
                      onClick={() => { setSelectedStock(stock.stockKey); setViewMode('single'); }}
                    >
                      <td className="py-4 px-4 font-medium">{stock.stockCode}</td>
                      <td className="py-4 px-4">{stock.stockName}</td>
                      <td className="py-4 px-4 text-right font-bold">
                        {stock.error ? <span className="text-red-400">Error</span> : `¥${stock.currentPrice?.toLocaleString()}`}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {!stock.error && (
                          <span className={stock.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {stock.change >= 0 ? '+' : ''}{stock.change?.toLocaleString()}
                            <span className="text-sm ml-1">({stock.change >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {!stock.error && `${(stock.volume / 1000000).toFixed(2)}M`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Alerts View */}
        {viewMode === 'alerts' && (
          <div className="space-y-6">
            {/* Create new alert */}
            <div className="bg-gray-800/60 backdrop-blur rounded-3xl p-8 border border-gray-700 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">Set Price Alert</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Select Stock</label>
                  <select
                    value={selectedStock}
                    onChange={(e) => setSelectedStock(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 rounded-xl text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    {stocks.map(stock => (
                      <option key={stock.key} value={stock.key}>{stock.name} ({stock.code})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Alert Type</label>
                  <select
                    value={newAlertType}
                    onChange={(e) => setNewAlertType(e.target.value as 'above' | 'below')}
                    className="w-full px-4 py-2 bg-gray-700 rounded-xl text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="above">Price rises to ≥</option>
                    <option value="below">Price falls to ≤</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Target Price (¥)</label>
                  <input
                    type="number"
                    value={newAlertPrice}
                    onChange={(e) => setNewAlertPrice(e.target.value)}
                    placeholder="e.g. 8000"
                    className="w-full px-4 py-2 bg-gray-700 rounded-xl text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Note (Optional)</label>
                  <input
                    type="text"
                    value={newAlertNote}
                    onChange={(e) => setNewAlertNote(e.target.value)}
                    placeholder="e.g. Take profit"
                    className="w-full px-4 py-2 bg-gray-700 rounded-xl text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <button
                onClick={createAlert}
                className="w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
              >
                Create Alert
              </button>
            </div>

            {/* Active alerts list */}
            <div className="bg-gray-800/60 backdrop-blur rounded-3xl p-8 border border-gray-700 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">Active Alerts ({alerts.filter(a => !a.triggeredAt).length})</h2>
              {alerts.filter(a => !a.triggeredAt).length === 0 ? (
                <p className="text-gray-400 text-center py-8">No active alerts</p>
              ) : (
                <div className="space-y-3">
                  {alerts.filter(a => !a.triggeredAt).map(alert => (
                    <div key={alert.id} className="flex items-center justify-between bg-gray-700/50 rounded-xl p-4">
                      <div>
                        <div className="font-semibold">{alert.stockName} ({alert.stockCode})</div>
                        <div className="text-sm text-gray-400">
                          {alert.type === 'above' ? '≥' : '≤'} ¥{alert.targetPrice.toLocaleString()}
                          {alert.note && <span className="ml-2 text-gray-500">({alert.note})</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="px-4 py-2 bg-red-600/80 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Triggered alerts */}
            {triggeredAlerts.length > 0 && (
              <div className="bg-gray-800/60 backdrop-blur rounded-3xl p-8 border border-gray-700 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-green-400">Triggered Alerts ✅</h2>
                <div className="space-y-3">
                  {triggeredAlerts.map(alert => (
                    <div key={alert.id} className="flex items-center justify-between bg-green-900/20 border border-green-700/50 rounded-xl p-4">
                      <div>
                        <div className="font-semibold">{alert.stockName} ({alert.stockCode})</div>
                        <div className="text-sm text-gray-400">
                          Target: {alert.type === 'above' ? '≥' : '≤'} ¥{alert.targetPrice.toLocaleString()}
                          <span className="ml-2 text-green-400">Triggered at: ¥{alert.triggeredPrice?.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Triggered: {new Date(alert.triggeredAt!).toLocaleString('en-US')}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stock Management View */}
        {viewMode === 'manage' && (
          <div className="space-y-6">
            {/* Add new stock */}
            <div className="bg-gray-800/60 backdrop-blur rounded-3xl p-8 border border-gray-700 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">Add New Stock</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Stock Symbol</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newStockSymbol}
                      onChange={(e) => setNewStockSymbol(e.target.value)}
                      placeholder="e.g. 7203 or 7203.T"
                      className="flex-1 px-4 py-2 bg-gray-700 rounded-xl text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={searchStock}
                      disabled={searching}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
                    >
                      {searching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    Enter stock code. For Tokyo stocks, .T will be added automatically.
                  </p>
                </div>

                {searchResult && (
                  <div className={`p-4 rounded-xl ${searchResult.valid ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                    {searchResult.valid ? (
                      <div>
                        <p className="text-green-400 font-semibold">✅ Stock Found</p>
                        <p className="text-white">{searchResult.name}</p>
                        <p className="text-gray-400 text-sm">{searchResult.exchange}</p>
                        <p className="text-gray-500 text-sm">Symbol: {searchResult.symbol}</p>
                      </div>
                    ) : (
                      <p className="text-red-400">❌ {searchResult.error || 'Stock not found'}</p>
                    )}
                  </div>
                )}

                {searchResult?.valid && (
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Display Name (Optional)</label>
                    <input
                      type="text"
                      value={newStockName}
                      onChange={(e) => setNewStockName(e.target.value)}
                      placeholder={searchResult.name}
                      className="w-full px-4 py-2 bg-gray-700 rounded-xl text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                {searchResult?.valid && (
                  <button
                    onClick={addStock}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Add Stock
                  </button>
                )}
              </div>
            </div>

            {/* Current stocks list */}
            <div className="bg-gray-800/60 backdrop-blur rounded-3xl p-8 border border-gray-700 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">My Watchlist ({stocks.length} stocks)</h2>
              {stocks.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No stocks added yet</p>
              ) : (
                <div className="space-y-3">
                  {stocks.map(stock => (
                    <div key={stock.key} className="flex items-center justify-between bg-gray-700/50 rounded-xl p-4">
                      <div>
                        <div className="font-semibold">{stock.name}</div>
                        <div className="text-sm text-gray-400">
                          {stock.code} - {stock.exchange}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteStock(stock.key)}
                        className="px-4 py-2 bg-red-600/80 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status bar */}
        <div className="flex items-center justify-center space-x-2 mt-8">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-sm font-medium">Real-time Updates Active</span>
          <span className="text-gray-500 mx-2">|</span>
          <span className="text-gray-400 text-sm">{stocks.length} stocks</span>
          {notificationEnabled && (
            <>
              <span className="text-gray-500 mx-2">|</span>
              <span className="text-blue-400 text-sm">Notifications Enabled</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockFetcher;
