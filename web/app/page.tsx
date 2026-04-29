'use client';

import { useEffect, useState } from 'react';
import Dashboard from '@/components/Dashboard';
import LandingPage from '@/components/LandingPage';
import { useWallet } from '@/utils/wallet';

export default function Home() {
  const wallet = useWallet();
  const [showDashboard, setShowDashboard] = useState(false);

  // Show dashboard when wallet is connected
  useEffect(() => {
    if (wallet.isConnected) {
      setShowDashboard(true);
    } else {
      setShowDashboard(false);
    }
  }, [wallet.isConnected]);

  // If wallet is connected, show dashboard
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
