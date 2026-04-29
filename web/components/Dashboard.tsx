'use client';

import { useState } from 'react';
import { DashboardTab } from '@/types/dashboard';
import OverviewTab from '@/components/tabs/OverviewTab';
import PayRollTab from '@/components/tabs/PayRollTab';
import TeamTab from '@/components/tabs/TeamTab';
import LedgerTab from '@/components/tabs/LedgerTab';
import CashOutTab from '@/components/tabs/CashOutTab';

type DashboardProps = {
  walletAddress: string | null;
  isWalletConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
};

export default function Dashboard({
  walletAddress,
  isWalletConnected,
  connectWallet,
  disconnectWallet,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  const menuItems = [
    { id: 'overview' as DashboardTab, label: 'Overview', icon: '⊞' },
    { id: 'payroll' as DashboardTab, label: 'Payroll', icon: '☰' },
    { id: 'team' as DashboardTab, label: 'Team', icon: '👥' },
    { id: 'ledger' as DashboardTab, label: 'Ledger', icon: '▤' },
    { id: 'cashout' as DashboardTab, label: 'CashOut', icon: '💵' },
  ];

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="bg-[#1a1f2e] rounded-xl shadow-2xl p-12 text-center border border-gray-800">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">
            Connect your Stellar wallet to access the dashboard
          </p>
          <button
            onClick={connectWallet}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419] flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#1a1f2e] border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div>
            <h1 className="text-white font-bold text-xl">LumenShake</h1>
            <p className="text-gray-400 text-xs">Stellar Payroll</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-[#252b3d] hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Network Status */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-400">Stellar Testnet</span>
          </div>
          <p className="text-gray-500 text-xs mt-1">Ledger: #52,184,291</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="bg-[#1a1f2e] border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white capitalize">{activeTab}</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-green-900/30 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-400 text-sm font-medium">Soroban Active</span>
            </div>
            <div className="bg-[#252b3d] px-4 py-2 rounded-lg">
              <span className="text-gray-300 text-sm">
                {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
              </span>
            </div>
            <button
              onClick={disconnectWallet}
              className="px-4 py-2 bg-red-600/20 border border-red-700/50 text-red-400 rounded-lg hover:bg-red-600/30 transition text-sm font-medium"
            >
              Disconnect
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'overview' && <OverviewTab walletAddress={walletAddress} connectWallet={connectWallet} />}
          {activeTab === 'payroll' && <PayRollTab walletAddress={walletAddress} />}
          {activeTab === 'team' && <TeamTab walletAddress={walletAddress} userRole={isWalletConnected ? 'employer' : null} />}
          {activeTab === 'ledger' && <LedgerTab walletAddress={walletAddress} />}
          {activeTab === 'cashout' && <CashOutTab walletAddress={walletAddress} isWalletConnected={isWalletConnected} />}
        </div>
      </main>
    </div>
  );
}
