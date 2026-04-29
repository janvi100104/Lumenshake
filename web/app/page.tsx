'use client';

import { useEffect, useState } from 'react';
import Dashboard from '@/components/Dashboard';
import LandingPage from '@/components/LandingPage';
import { useWallet } from '@/utils/wallet';

export default function Home() {
  const wallet = useWallet();
  const [showDashboard, setShowDashboard] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Show dashboard when wallet is connected
  useEffect(() => {
    if (wallet.isConnected) {
      setIsTransitioning(true);
      // Small delay for smooth transition
      setTimeout(() => {
        setShowDashboard(true);
        setIsTransitioning(false);
      }, 300);
    } else {
      setShowDashboard(false);
    }
  }, [wallet.isConnected]);

  // Show loading state during transition
  if (isTransitioning) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // If wallet is connected, show dashboard with all 5 tabs
  if (showDashboard && wallet.isConnected) {
    return (
      <Dashboard 
        walletAddress={wallet.address}
        isWalletConnected={wallet.isConnected}
        connectWallet={wallet.connectWallet}
        disconnectWallet={wallet.disconnectWallet}
      />
    );
  }

  // Otherwise show landing page
  return <LandingPage />;
}
