import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownLeft, Copy, Send, Download, TrendingUp, AlertCircle, CheckCircle, Search, Filter, X, Link, Calendar, Clock, Hash } from 'lucide-react';

interface Transaction {
  id: number;
  type: 'received' | 'sent';
  amount: number;
  symbol: string;
  value: number;
  from: string;
  to: string;
  time: string;
  date: string;
  status: 'confirmed' | 'pending';
  hash: string;
}

const CryptoWallet = () => {
  const [balance] = useState({
    total: 125847.32,
    change: 12.5,
    currency: 'USD'
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const allTransactions: Transaction[] = [
    {
      id: 1,
      type: 'received',
      amount: 2.458,
      symbol: 'BTC',
      value: 125847.32,
      from: '0x8f3a...9c2d',
      to: 'My Wallet',
      time: '2:34 PM',
      date: '2024-12-20',
      status: 'confirmed',
      hash: '0x8f3a2b7c9d1e4f6a8b3c9d2e5f7a9b4'
    },
    {
      id: 2,
      type: 'sent',
      amount: 1.234,
      symbol: 'BTC',
      value: 63000.50,
      from: 'My Wallet',
      to: '0x4e7f...a1b2',
      time: 'Yesterday, 8:15 PM',
      date: '2024-12-19',
      status: 'confirmed',
      hash: '0x4e7f3a8b1c9d2e6f5a8b3c9d4e7f2a1'
    },
    {
      id: 3,
      type: 'received',
      amount: 0.789,
      symbol: 'BTC',
      value: 40256.80,
      from: 'Coinbase',
      to: 'My Wallet',
      time: 'Dec 15, 3:45 PM',
      date: '2024-12-15',
      status: 'pending',
      hash: '0x9c2d4e7f8a3b1c9d2e6f5a8b4c7d3e2f'
    },
    {
      id: 4,
      type: 'sent',
      amount: 0.345,
      symbol: 'BTC',
      value: 17568.90,
      from: 'My Wallet',
      to: 'Binance',
      time: 'Dec 14, 10:20 AM',
      date: '2024-12-14',
      status: 'confirmed',
      hash: '0x1b3a9f4e8c2d7f6a5b8c3d9e2f1a4b7'
    }
  ];

  const [transactions, setTransactions] = useState(allTransactions); // eslint-disable-line @typescript-eslint/no-unused-vars

  const chartData = [
    { month: 'Aug', value: 98000 },
    { month: 'Sep', value: 105000 },
    { month: 'Oct', value: 112000 },
    { month: 'Nov', value: 118000 },
    { month: 'Dec', value: 125847 }
  ];

  // Filter transactions based on search and status
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = searchTerm === '' || 
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.to.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const openTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const TransactionModal = ({ transaction, onClose }: { transaction: Transaction | null, onClose: () => void }) => {
    if (!transaction) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 w-full max-w-sm rounded-3xl p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Transaction Details</h3>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-800 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Amount</span>
                <span className={`font-bold text-lg ${transaction.type === 'received' ? 'text-green-400' : 'text-red-400'}`}>
                  {transaction.type === 'received' ? '+' : '-'}{transaction.amount} {transaction.symbol}
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-500">${transaction.value.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-full ${transaction.type === 'received' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {transaction.type === 'received' ? 
                  <ArrowDownLeft className="w-5 h-5 text-green-400" /> : 
                  <ArrowUpRight className="w-5 h-5 text-red-400" />
                }
              </div>
              <span className="text-lg capitalize">{transaction.type}</span>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-800/50 rounded-xl p-3">
                <div className="flex items-center space-x-2 text-gray-400 text-sm mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Date</span>
                </div>
                <p className="text-white">{transaction.date}</p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-3">
                <div className="flex items-center space-x-2 text-gray-400 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Time</span>
                </div>
                <p className="text-white">{transaction.time}</p>
              </div>

              {transaction.type === 'received' ? (
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <div className="flex items-center space-x-2 text-gray-400 text-sm mb-1">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>From</span>
                  </div>
                  <p className="text-white font-mono text-sm">{transaction.from}</p>
                </div>
              ) : (
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <div className="flex items-center space-x-2 text-gray-400 text-sm mb-1">
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>To</span>
                  </div>
                  <p className="text-white font-mono text-sm">{transaction.to}</p>
                </div>
              )}

              <div className="bg-gray-800/50 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <Hash className="w-4 h-4" />
                    <span>Transaction Hash</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(transaction.hash)}
                    className="text-purple-400 hover:text-purple-300 text-sm flex items-center space-x-1"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="text-white font-mono text-xs mt-1 break-all">{transaction.hash}</p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-3">
                <div className="flex items-center space-x-2 text-gray-400 text-sm mb-1">
                  {transaction.status === 'confirmed' ? 
                    <CheckCircle className="w-4 h-4 text-green-400" /> : 
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                  }
                  <span>Status</span>
                </div>
                <p className={`text-sm ${transaction.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </p>
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(transaction.hash)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-2xl transition-colors flex items-center justify-center space-x-2"
            >
              <Link className="w-5 h-5" />
              <span>View on Explorer</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="bg-gray-800 rounded-3xl h-32"></div>
      <div className="bg-gray-800 rounded-3xl h-40"></div>
      <div className="bg-gray-800 rounded-2xl h-20"></div>
      <div className="bg-gray-800 rounded-2xl h-20"></div>
      <div className="bg-gray-800 rounded-2xl h-20"></div>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="bg-gray-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="w-10 h-10 text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No transactions found</h3>
      <p className="text-gray-400">Try adjusting your search or filters</p>
    </div>
  );

  const TransactionItem = ({ transaction }: { transaction: Transaction }) => (
    <div 
      className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800 hover:border-gray-700 transition-all duration-300 cursor-pointer"
      onClick={() => openTransactionDetails(transaction)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${transaction.type === 'received' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            {transaction.type === 'received' ? 
              <ArrowDownLeft className="w-5 h-5 text-green-400" /> : 
              <ArrowUpRight className="w-5 h-5 text-red-400" />
            }
          </div>
          <div>
            <p className="text-white font-medium">
              {transaction.type === 'received' ? 'Received' : 'Sent'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {transaction.time}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {transaction.type === 'received' ? 
                `From: ${transaction.from}` : 
                `To: ${transaction.to}`
              }
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-bold ${transaction.type === 'received' ? 'text-green-400' : 'text-red-400'}`}>
            {transaction.type === 'received' ? '+' : '-'}{transaction.amount} {transaction.symbol}
          </p>
          <p className="text-white font-medium mt-1">
            ${transaction.value.toLocaleString()}
          </p>
          <div className="flex items-center justify-end mt-2">
            {transaction.status === 'confirmed' ? 
              <CheckCircle className="w-4 h-4 text-green-400 mr-1" /> : 
              <AlertCircle className="w-4 h-4 text-yellow-400 mr-1" />
            }
            <span className={`text-xs ${transaction.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'}`}>
              {transaction.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur rounded-3xl p-6 mb-6 border border-gray-700">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Total Balance</p>
            <h2 className="text-3xl font-bold mb-2">
              ${balance.total.toLocaleString()}
            </h2>
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">
                +{balance.change}%
              </span>
              <span className="text-gray-500 text-xs">vs last month</span>
            </div>
          </div>
        </div>

        {/* Portfolio Chart */}
        <div className="bg-gray-800/50 backdrop-blur rounded-3xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Portfolio Performance</h3>
            <div className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-medium">
              5 Months
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month" 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#9333EA"
                strokeWidth={2}
                dot={{ fill: '#9333EA', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 mb-4 border border-gray-700">
          <div className="flex items-center space-x-3 mb-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 w-full text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex space-x-2">
              {[
                { label: 'All', value: 'all' },
                { label: 'Confirmed', value: 'confirmed' },
                { label: 'Pending', value: 'pending' }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    filterStatus === filter.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-xl">Transaction History</h3>
          <span className="text-gray-400 text-sm">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>

        {/* Transactions List or Loading/Empty State */}
        <div className="space-y-3 mb-6">
          {loading ? (
            <LoadingSkeleton />
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Primary Actions */}
        <div className="flex space-x-4">
          <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-colors">
            <Send className="w-5 h-5" />
            <span>Send</span>
          </button>
          <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-colors">
            <Download className="w-5 h-5" />
            <span>Receive</span>
          </button>
        </div>

        {/* Transaction Details Modal */}
        {isModalOpen && selectedTransaction && (
          <TransactionModal 
            transaction={selectedTransaction} 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </div>
    </div>
  );
};

export default CryptoWallet;
