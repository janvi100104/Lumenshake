'use client';

import { useState } from 'react';
import WalletConnection from '@/components/WalletConnection';
import EmployerDashboard from '@/components/EmployerDashboard';
import WorkerDashboard from '@/components/WorkerDashboard';
import SEP24Dashboard from '@/components/SEP24Dashboard';
import CashOutDashboard from '@/components/CashOutDashboard';
import { useWallet } from '@/utils/wallet';

type DashboardTab = 'employer' | 'worker' | 'deposit' | 'cashout';

// Add tab or route for cash-out

export default function Home() {
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState<DashboardTab>('employer');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">LumenShake</h1>
            <p className="text-sm text-gray-600">Stellar-Powered Payroll System</p>
          </div>
          <WalletConnection
            address={wallet.address}
            isConnected={wallet.isConnected}
            loading={wallet.loading}
            freighterInstalled={wallet.freighterInstalled}
            connectWallet={wallet.connectWallet}
            disconnectWallet={wallet.disconnectWallet}
          />
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm p-2 inline-flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('employer')}
            className={`px-6 py-2 rounded-md font-medium transition ${
              activeTab === 'employer'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Employer
          </button>
          <button
            onClick={() => setActiveTab('worker')}
            className={`px-6 py-2 rounded-md font-medium transition ${
              activeTab === 'worker'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Worker
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            className={`px-6 py-2 rounded-md font-medium transition ${
              activeTab === 'deposit'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Deposit/Withdraw
          </button>
          <button
            onClick={() => setActiveTab('cashout')}
            className={`px-6 py-2 rounded-md font-medium transition ${
              activeTab === 'cashout'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            💵 Cash Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'employer' ? (
          <EmployerDashboard
            employerAddress={wallet.address}
            isWalletConnected={wallet.isConnected}
          />
        ) : activeTab === 'worker' ? (
          <WorkerDashboard
            workerAddress={wallet.address}
            isWalletConnected={wallet.isConnected}
          />
        ) : activeTab === 'deposit' ? (
          <SEP24Dashboard />
        ) : (
          <CashOutDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-gray-600">
          <p>Built on Stellar Soroban • Cross-Border Payroll Made Simple</p>
        </div>
      </footer>
    </div>
  );
}
