'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { useWallet } from '@/utils/wallet';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface SEP24Transaction {
  id: string;
  kind: 'deposit' | 'withdrawal';
  status: string;
  amount_expected?: string;
  amount_in?: string;
  amount_out?: string;
  amount_fee?: string;
  start_time: string;
  updated_at: string;
  completed_at?: string;
  more_info_url: string;
  message?: string;
}

export default function SEP24Dashboard() {
  const toast = useToast();
  const { address } = useWallet();
  
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [assetCode, setAssetCode] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [externalAccount, setExternalAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<SEP24Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<SEP24Transaction | null>(null);
  const [showTxDetails, setShowTxDetails] = useState(false);

  // Load transactions on mount
  useEffect(() => {
    if (address) {
      loadTransactions();
    }
  }, [address]);

  const loadTransactions = async () => {
    try {
      const token = localStorage.getItem('sep10_token');
      if (!token) return;

      const response = await fetch(`${API_URL}/sep24/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      toast.error('Wallet not connected', 'Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Invalid amount', 'Please enter a valid amount greater than 0');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('sep10_token');
      if (!token) {
        toast.error('Not authenticated', 'Please complete SEP-10 authentication first');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/sep24/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          asset_code: assetCode,
          asset_issuer: '', // Can be left empty for testnet
          amount: amount,
          external_account: externalAccount || undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(
          'Deposit initiated!',
          `Transaction ID: ${data.data.id}. Visit the interactive page to complete deposit.`
        );
        
        // Load the interactive URL
        window.open(data.data.more_info_url, '_blank');
        
        // Reload transactions
        await loadTransactions();
        
        // Reset form
        setAmount('');
        setExternalAccount('');
      } else {
        toast.error('Deposit failed', data.error || data.message);
      }
    } catch (error) {
      toast.error(
        'Deposit failed',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      toast.error('Wallet not connected', 'Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Invalid amount', 'Please enter a valid amount greater than 0');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('sep10_token');
      if (!token) {
        toast.error('Not authenticated', 'Please complete SEP-10 authentication first');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/sep24/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          asset_code: assetCode,
          asset_issuer: '',
          amount: amount,
          external_account: externalAccount || undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(
          'Withdrawal initiated!',
          `Transaction ID: ${data.data.id}. Follow the instructions to complete withdrawal.`
        );
        
        window.open(data.data.more_info_url, '_blank');
        await loadTransactions();
        
        setAmount('');
        setExternalAccount('');
      } else {
        toast.error('Withdrawal failed', data.error || data.message);
      }
    } catch (error) {
      toast.error(
        'Withdrawal failed',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending_user_transfer_start':
      case 'pending_external':
      case 'pending_anchor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'error':
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'pending_user_transfer_start':
      case 'pending_external':
      case 'pending_anchor':
        return '⏳';
      case 'error':
        return '✕';
      default:
        return '○';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Deposit & Withdraw</h1>
        <p className="text-blue-100">
          Interactive deposits and withdrawals powered by SEP-24
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
            activeTab === 'deposit'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
            activeTab === 'withdraw'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Withdraw
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={activeTab === 'deposit' ? handleDeposit : handleWithdraw}>
          <div className="space-y-4">
            {/* Asset Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset Code
              </label>
              <input
                type="text"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="USDC"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Currently supports USDC on testnet</p>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ({assetCode})
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            {/* External Account (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                External Account <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={externalAccount}
                onChange={(e) => setExternalAccount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bank account or external wallet address"
              />
              <p className="text-xs text-gray-500 mt-1">
                {activeTab === 'deposit'
                  ? 'Source account for deposit (e.g., bank account number)'
                  : 'Destination account for withdrawal (e.g., bank account number)'}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !address}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : activeTab === 'deposit' ? (
                'Start Deposit'
              ) : (
                'Start Withdrawal'
              )}
            </button>

            {!address && (
              <p className="text-sm text-center text-red-600">
                Please connect your wallet to continue
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {transactions.slice(0, 10).map((tx) => (
              <div
                key={tx.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                onClick={() => {
                  setSelectedTx(tx);
                  setShowTxDetails(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getStatusIcon(tx.status)}</span>
                    <div>
                      <p className="font-medium capitalize">
                        {tx.kind} {tx.amount_expected && `${tx.amount_expected} ${assetCode}`}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(tx.start_time)}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      tx.status
                    )}`}
                  >
                    {tx.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showTxDetails && selectedTx && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Transaction Details</h3>
              <button
                onClick={() => setShowTxDetails(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-mono text-sm break-all">{selectedTx.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium capitalize">{selectedTx.kind}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                      selectedTx.status
                    )}`}
                  >
                    {selectedTx.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {selectedTx.amount_expected && (
                <div>
                  <p className="text-sm text-gray-500">Amount Expected</p>
                  <p className="font-medium">{selectedTx.amount_expected} {assetCode}</p>
                </div>
              )}

              {selectedTx.amount_in && (
                <div>
                  <p className="text-sm text-gray-500">Amount In</p>
                  <p className="font-medium">{selectedTx.amount_in}</p>
                </div>
              )}

              {selectedTx.amount_out && (
                <div>
                  <p className="text-sm text-gray-500">Amount Out</p>
                  <p className="font-medium">{selectedTx.amount_out}</p>
                </div>
              )}

              {selectedTx.amount_fee && (
                <div>
                  <p className="text-sm text-gray-500">Fee</p>
                  <p className="font-medium">{selectedTx.amount_fee}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">Started At</p>
                <p className="font-medium">{formatDate(selectedTx.start_time)}</p>
              </div>

              {selectedTx.updated_at && (
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">{formatDate(selectedTx.updated_at)}</p>
                </div>
              )}

              {selectedTx.message && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">{selectedTx.message}</p>
                </div>
              )}

              <a
                href={selectedTx.more_info_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-medium py-2 rounded-lg transition"
              >
                View Interactive Page →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
