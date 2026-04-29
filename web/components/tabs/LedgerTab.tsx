'use client';

import { useState, useEffect } from 'react';
import { useEscrowBalance, useTransactionHistory } from '@/hooks/useDashboardData';

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org';
const EXPLORER_URL = 'https://stellar.expert/explorer/testnet';

type LedgerTabProps = {
  walletAddress: string | null;
};

export default function LedgerTab({ walletAddress }: LedgerTabProps) {
  const { balance: escrowBalance, loading: balanceLoading, refetch: refetchBalance } = useEscrowBalance();
  const { transactions, loading: txLoading } = useTransactionHistory(walletAddress, 50);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchBalance();
      setLastSynced(new Date());
    }, 10000);

    return () => clearInterval(interval);
  }, [refetchBalance]);

  const loading = balanceLoading || txLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Transaction Ledger</h2>
          <p className="text-gray-400 text-sm mt-1">On-chain payroll audit trail</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Live sync</span>
          <span className="text-gray-600">•</span>
          <span>Last: {lastSynced.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Transaction Table */}
        <div className="lg:col-span-2">
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📖</div>
                <p className="text-gray-400">No transactions recorded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#252b3d] border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction Hash</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Explorer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {transactions.map((tx, index) => (
                      <tr key={tx.id || tx.tx_hash || index} className="hover:bg-[#252b3d] transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-400">
                            {tx.tx_hash.slice(0, 8)}...{tx.tx_hash.slice(-6)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white capitalize">
                            {tx.action_type.replace(/_/g, ' ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-white">
                            {tx.amount ? `$${tx.amount}` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            tx.status === 'success' ? 'bg-green-900/50 text-green-400' :
                            tx.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                            'bg-red-900/50 text-red-400'
                          }`}>
                            {tx.status === 'success' ? 'CONFIRMED' : tx.status === 'pending' ? 'PENDING' : 'FAILED'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400">
                            {new Date(tx.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a
                            href={`${EXPLORER_URL}/tx/${tx.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:underline"
                          >
                            View →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Soroban Contract State */}
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Soroban Contract State</h3>
            
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-4">
              <p className="text-blue-400 text-xs mb-1">ESCROW BALANCE</p>
              <p className="text-2xl font-bold text-white">${escrowBalance} USDC</p>
              <p className="text-gray-400 text-xs mt-1">
                {CONTRACT_ID ? `${CONTRACT_ID.slice(0, 6)}...${CONTRACT_ID.slice(-4)}` : 'Not configured'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400 text-sm">Multi-sig</span>
                <span className="text-gray-300 text-sm">2 of 3</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400 text-sm">Time-lock</span>
                <span className="text-gray-300 text-sm">24 hours</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400 text-sm">USDC Token</span>
                <span className="text-gray-300 text-sm font-mono text-xs">GBBD47IF...</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-400 text-sm">Pause</span>
                <span className="text-gray-300 text-sm">Inactive</span>
              </div>
            </div>
          </div>

          {/* Network Info */}
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Network Info</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400 text-sm">Network</span>
                <span className="text-white text-sm font-semibold">Stellar Testnet</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400 text-sm">RPC URL</span>
                <span className="text-gray-300 text-xs font-mono">soroban-testnet...</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-400 text-sm">Explorer</span>
                <a
                  href={EXPLORER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-sm hover:underline"
                >
                  Stellar Expert →
                </a>
              </div>
            </div>
          </div>

          {/* Transaction Stats */}
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Transaction Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400 text-sm">Total Transactions</span>
                <span className="text-white text-sm font-semibold">{transactions.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400 text-sm">Confirmed</span>
                <span className="text-green-400 text-sm font-semibold">
                  {transactions.filter(tx => tx.status === 'success').length}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400 text-sm">Pending</span>
                <span className="text-yellow-400 text-sm font-semibold">
                  {transactions.filter(tx => tx.status === 'pending').length}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-400 text-sm">Failed</span>
                <span className="text-red-400 text-sm font-semibold">
                  {transactions.filter(tx => tx.status === 'failed').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
