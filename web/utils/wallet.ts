import { useEffect, useState } from 'react';
import { getAddress, isConnected, requestAccess } from '@stellar/freighter-api';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Failed to connect wallet.';
};

export const useWallet = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnectedState, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [freighterInstalled, setFreighterInstalled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadWalletStatus = async () => {
      const connection = await isConnected();

      if (cancelled) {
        return;
      }

      const installed = Boolean(connection.isConnected) && !connection.error;
      setFreighterInstalled(installed);

      if (!installed) {
        return;
      }

      const walletAddress = await getAddress();
      if (!walletAddress.error && walletAddress.address) {
        setAddress(walletAddress.address);
        setIsConnected(true);
      }
    };

    void loadWalletStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  const connectWallet = async () => {
    try {
      setLoading(true);

      const connection = await isConnected();
      if (connection.error || !connection.isConnected) {
        setFreighterInstalled(false);
        throw new Error('Freighter wallet is not detected. Install or enable Freighter and try again.');
      }

      setFreighterInstalled(true);

      const accessResponse = await requestAccess();
      const errorMessage = accessResponse.error?.message.toLowerCase() || '';

      if (accessResponse.error || !accessResponse.address) {
        if (errorMessage.includes('rejected') || errorMessage.includes('denied')) {
          throw new Error('Connection denied. Please approve access in Freighter.');
        }

        if (errorMessage.includes('locked')) {
          throw new Error('Freighter is locked. Please unlock it and try again.');
        }

        throw new Error(accessResponse.error?.message || 'Could not connect to Freighter.');
      }

      setAddress(accessResponse.address);
      setIsConnected(true);
    } catch (error: unknown) {
      console.error('Error connecting wallet:', error);
      alert(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
  };

  return {
    address,
    isConnected: isConnectedState,
    loading,
    freighterInstalled,
    connectWallet,
    disconnectWallet,
  };
};
