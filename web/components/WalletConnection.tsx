'use client';

type WalletConnectionProps = {
  address: string | null;
  isConnected: boolean;
  loading: boolean;
  freighterInstalled: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
};

export default function WalletConnection({
  address,
  isConnected,
  loading,
  freighterInstalled,
  connectWallet,
  disconnectWallet,
}: WalletConnectionProps) {
  return (
    <div className="flex items-center gap-4">
      {isConnected ? (
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-green-100 text-green-800">
            <span className="text-sm font-medium">
              Connected
            </span>
            <p className="text-xs font-mono mt-1">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <button
            onClick={disconnectWallet}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={connectWallet}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? 'Connecting...' : 'Connect Freighter Wallet'}
          </button>
          {freighterInstalled && (
            <span className="text-xs text-green-600">✓ Freighter detected</span>
          )}
          {!freighterInstalled && (
            <span className="text-xs text-red-600">Freighter not detected</span>
          )}
        </div>
      )}
    </div>
  );
}
