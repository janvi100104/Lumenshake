'use client';

import { useEscrowBalance, useDashboardStats, useTransactionHistory } from '@/hooks/useDashboardData';
import { formatTransactionStatus, getStatusColor } from '@/utils/transactionStatus';

const EXPLORER_URL = 'https://stellar.expert/explorer/testnet';

type OverviewTabProps = {
  walletAddress: string | null;
  connectWallet?: () => Promise<void>;
};

export default function OverviewTab({ walletAddress, connectWallet }: OverviewTabProps) {
  const { balance: escrowBalance, loading: balanceLoading } = useEscrowBalance();
  const { stats, loading: statsLoading } = useDashboardStats(walletAddress, 'employer');
  const { transactions, loading: txLoading } = useTransactionHistory(walletAddress, 10);

  const loading = balanceLoading || statsLoading || txLoading;

  if (loading) {
    return (
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-400 mt-4">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connect Wallet Banner (if not connected) */}
      {!walletAddress && connectWallet && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h3 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-blue-100 mb-6">
            Connect your Stellar wallet to view real-time payroll data and manage your team
          </p>
          <button
            onClick={connectWallet}
            className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold text-lg"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Workers */}
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
          <p className="text-gray-400 text-sm mb-2">ACTIVE WORKERS</p>
          <p className="text-3xl font-bold text-white">{stats.totalEmployees}</p>
          <p className="text-gray-500 text-sm mt-2">+8 this month</p>
        </div>

        {/* Total Payroll */}
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
          <p className="text-gray-400 text-sm mb-2">TOTAL PAYROLL (NOV)</p>
          <p className="text-3xl font-bold text-white">${escrowBalance}</p>
          <p className="text-gray-500 text-sm mt-1">USDC</p>
          <p className="text-gray-600 text-xs mt-1">via Stellar SEP-31</p>
        </div>

        {/* Pending KYC */}
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
          <p className="text-gray-400 text-sm mb-2">PENDING KYC</p>
          <p className="text-3xl font-bold text-orange-500">{stats.pendingClaims}</p>
          <p className="text-gray-500 text-sm mt-2">SEP-12 required</p>
        </div>

        {/* Contract Health */}
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
          <p className="text-gray-400 text-sm mb-2">CONTRACT HEALTH</p>
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <p className="text-green-500 font-semibold">OPERATIONAL</p>
          </div>
          <p className="text-gray-500 text-sm mt-1">Soroban v21</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll Contract Runs */}
        <div className="lg:col-span-2 bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Payroll Contract Runs</h3>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No payroll runs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 4).map((tx, index) => (
                <div key={tx.id || tx.tx_hash || index} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                  <div className="flex items-center space-x-6">
                    <span className="text-gray-400 font-mono text-sm">
                      {tx.tx_hash.slice(0, 6)}...{tx.tx_hash.slice(-4)}
                    </span>
                    <span className="text-gray-300">
                      {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                    </span>
                    <span className="text-gray-400">48</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'success' ? 'bg-green-900/50 text-green-400' :
                      tx.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {tx.status === 'success' ? 'CONFIRMED' : tx.status === 'pending' ? 'PENDING' : 'FAILED'}
                    </span>
                    <span className="text-gray-300 font-semibold">
                      ${tx.amount || '12,400'}
                    </span>
                    <button className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition">
                      {tx.status === 'success' ? 'View' : tx.status === 'pending' ? 'Retry' : 'Debug'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* AI Contract Summary */}
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6">
            <h4 className="text-yellow-400 font-semibold mb-2">AI Contract Summary</h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              Latest payroll run completed successfully. All 48 workers processed. Escrow balance healthy.
            </p>
          </div>

          {/* SEP-31 Anchor Status */}
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
            <h4 className="text-white font-semibold mb-4">SEP-31 Anchor Status</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">Circle USDC Anchor</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">MoneyGram (PHP)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">Stellar.org (NGN)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">LOBSTR (KES)</span>
              </div>
            </div>
          </div>

          {/* Worker KYC Overview */}
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
            <h4 className="text-white font-semibold mb-4">Worker KYC Overview</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-300 text-sm">Maria Santos</span>
                <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded">Verified</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-300 text-sm">Chidi Okafor</span>
                <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 text-xs rounded">Pending</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-300 text-sm">Ana Reyes</span>
                <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
        <h3 className="text-white font-semibold text-lg mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button className="px-6 py-3 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition font-medium">
            Run Payroll Contract
          </button>
          <button className="px-6 py-3 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition font-medium">
            Verify KYC (SEP-12)
          </button>
          <button className="px-6 py-3 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition font-medium">
            Top Up Escrow
          </button>
        </div>
      </div>
    </div>
  );
}
