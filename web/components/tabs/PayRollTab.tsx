'use client';

import { useState, useMemo, useEffect } from 'react';
import { PayrollContract } from '@/utils/contract';
import { pollTransactionStatus, formatTransactionStatus, TransactionInfo } from '@/utils/transactionStatus';
import { useToast } from '@/components/Toast';
import { useEscrowBalance, useTransactionHistory } from '@/hooks/useDashboardData';

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org';
const EXPLORER_URL = 'https://stellar.expert/explorer/testnet';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

type PayRollTabProps = {
  walletAddress: string | null;
};

export default function PayRollTab({ walletAddress }: PayRollTabProps) {
  const payrollContract = useMemo(() => new PayrollContract(CONTRACT_ID, RPC_URL), []);
  const toast = useToast();
  const { balance: escrowBalance, loading: balanceLoading } = useEscrowBalance();
  const { transactions, loading: txLoading } = useTransactionHistory(walletAddress, 20);

  const [period, setPeriod] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEmployerRegistered, setIsEmployerRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<TransactionInfo[]>([]);
  const [pollingTx, setPollingTx] = useState<string | null>(null);

  const canSubmit = Boolean(
    walletAddress &&
    CONTRACT_ID &&
    isEmployerRegistered &&
    !checkingRegistration
  );

  // Check employer registration
  useEffect(() => {
    let cancelled = false;

    const loadEmployerStatus = async () => {
      if (!walletAddress || !CONTRACT_ID) {
        setCheckingRegistration(false);
        setIsEmployerRegistered(false);
        return;
      }

      setCheckingRegistration(true);
      try {
        const employer = await payrollContract.getEmployer(walletAddress);
        if (!cancelled) {
          setIsEmployerRegistered(Boolean(employer));
        }
      } catch (error) {
        console.error('Failed to fetch employer status:', error);
        if (!cancelled) {
          setIsEmployerRegistered(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingRegistration(false);
        }
      }
    };

    loadEmployerStatus();

    return () => {
      cancelled = true;
    };
  }, [walletAddress, payrollContract]);

  const startTransactionPolling = async (txHash: string, actionName: string) => {
    setPollingTx(txHash);
    
    try {
      const finalStatus = await pollTransactionStatus(txHash, RPC_URL, {
        intervalMs: 2000,
        maxAttempts: 30,
        onStatusChange: (status) => {
          setRecentTransactions((prev) => {
            const existing = prev.findIndex((t) => t.txHash === txHash);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = status;
              return updated;
            }
            return [...prev, status];
          });
        },
      });

      if (finalStatus.status === 'success') {
        toast.success(`${actionName} confirmed on-chain`);
      } else if (finalStatus.status === 'failed') {
        toast.error(`${actionName} failed`, finalStatus.error || 'Unknown error');
      }
    } catch (error) {
      console.error(`Error polling ${actionName}:`, error);
    } finally {
      setPollingTx(null);
    }
  };

  const handleRunPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const parsedPeriod = Number.parseInt(period, 10);
      if (Number.isNaN(parsedPeriod)) {
        throw new Error('Payroll period must be a valid number.');
      }

      if (!walletAddress) {
        throw new Error('Wallet address is required.');
      }

      const response = await payrollContract.runPayroll(walletAddress, parsedPeriod);
      const txHash = response.txHash || null;

      if (txHash) {
        startTransactionPolling(txHash, 'Run Payroll');
        
        // Log transaction for Ledger tab
        try {
          await fetch(`${API_URL}/payroll/log-transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tx_hash: txHash,
              type: 'run_payroll',
              stellar_address: walletAddress,
              amount: 0,
              status: 'success',
              metadata: { period: parsedPeriod },
            }),
          });
        } catch (logError) {
          console.error('Failed to log transaction:', logError);
        }
      }

      toast.success('Payroll execution initiated', txHash ? `Tx: ${txHash}` : undefined);
      setPeriod('');
    } catch (error) {
      console.error('Error running payroll:', error);
      const message = error instanceof Error ? error.message : 'Failed to run payroll';
      toast.error('Payroll failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDepositEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!walletAddress) {
        throw new Error('Wallet address is required.');
      }

      const response = await payrollContract.depositEscrow(walletAddress, depositAmount);
      const txHash = response.txHash || null;

      if (txHash) {
        startTransactionPolling(txHash, 'Deposit Escrow');
      }

      toast.success('Deposit initiated', txHash ? `Tx: ${txHash}` : undefined);
      setDepositAmount('');
    } catch (error) {
      console.error('Error depositing to escrow:', error);
      const message = error instanceof Error ? error.message : 'Failed to deposit to escrow';
      toast.error('Deposit failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate stats
  const runsThisMonth = transactions.filter(tx => {
    const txDate = new Date(tx.created_at);
    const now = new Date();
    return txDate.getMonth() === now.getMonth() && tx.action_type === 'run_payroll';
  }).length;

  const failedRuns = transactions.filter(tx => 
    tx.action_type === 'run_payroll' && tx.status === 'failed'
  ).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Escrow Balance */}
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
          <p className="text-gray-400 text-sm mb-2">ESCROW BALANCE</p>
          <p className="text-3xl font-bold text-white">${escrowBalance}</p>
          <p className="text-gray-500 text-sm mt-1">USDC</p>
          <p className="text-gray-600 text-xs mt-1">Soroban contract</p>
        </div>

        {/* Runs This Month */}
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
          <p className="text-gray-400 text-sm mb-2">RUNS THIS MONTH</p>
          <p className="text-3xl font-bold text-white">{runsThisMonth}</p>
          <p className="text-gray-500 text-sm mt-2">weekly cycle</p>
        </div>

        {/* Failed Runs */}
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
          <p className="text-gray-400 text-sm mb-2">FAILED RUNS</p>
          <p className="text-3xl font-bold text-red-500">{failedRuns}</p>
          <p className="text-gray-500 text-sm mt-2">SEP-31 timeout</p>
        </div>

        {/* Next Scheduled */}
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
          <p className="text-gray-400 text-sm mb-2">NEXT SCHEDULED</p>
          <p className="text-3xl font-bold text-white">Nov 28</p>
          <p className="text-gray-500 text-sm mt-2">48 workers</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* USDC Disbursed Chart */}
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
            <h3 className="text-white font-semibold text-lg mb-6">USDC Disbursed (Weekly)</h3>
            <div className="flex items-end justify-between space-x-4 h-40">
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-blue-300 rounded-t-lg" style={{ height: '60%' }}></div>
                <p className="text-gray-400 text-sm mt-2">W1</p>
                <p className="text-gray-300 text-xs mt-1">$12,400</p>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-blue-200 rounded-t-lg" style={{ height: '75%' }}></div>
                <p className="text-gray-400 text-sm mt-2">W2</p>
                <p className="text-gray-300 text-xs mt-1">$12,400</p>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-red-300 rounded-t-lg" style={{ height: '40%' }}></div>
                <p className="text-gray-400 text-sm mt-2">W3</p>
                <p className="text-red-400 text-xs mt-1">FAILED</p>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-blue-600 rounded-t-lg" style={{ height: '65%' }}></div>
                <p className="text-gray-400 text-sm mt-2">W4</p>
                <p className="text-blue-400 text-xs mt-1">$11,500</p>
              </div>
            </div>
          </div>

          {/* Contract Run History */}
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Contract Run History</h3>
              <button
                onClick={() => document.getElementById('runPayrollForm')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition text-sm"
              >
                + New Run
              </button>
            </div>
            
            {transactions.filter(tx => tx.action_type === 'run_payroll').length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No payroll runs yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions
                  .filter(tx => tx.action_type === 'run_payroll')
                  .slice(0, 4)
                  .map((tx, index) => (
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
        </div>

        {/* Right Column - Contract State & Flow */}
        <div className="space-y-6">
          {/* Soroban Contract State */}
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Soroban Contract State</h3>
            
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-4">
              <p className="text-blue-400 text-xs mb-1">ESCROW ACCOUNT</p>
              <p className="text-2xl font-bold text-white">${escrowBalance} USDC</p>
              <p className="text-gray-400 text-xs mt-1">
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)} • Soroban
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
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-400 text-sm">Pause</span>
                <span className="text-gray-300 text-sm">Inactive</span>
              </div>
            </div>
          </div>

          {/* SEP-31 Run Flow */}
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">SEP-31 Run Flow</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Employer deposits USDC</p>
                  <p className="text-gray-500 text-xs">via SEP-24 on-ramp</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Soroban distributes USDC</p>
                  <p className="text-gray-500 text-xs">run_payroll() called</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Worker claims funds</p>
                  <p className="text-gray-500 text-xs">claim_payroll() on-chain</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">4</span>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Cash-out at MoneyGram</p>
                  <p className="text-gray-500 text-xs">Local currency pickup</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Run Payroll & Deposit Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Run Payroll Form */}
        <div id="runPayrollForm" className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Run Payroll</h3>
          <form onSubmit={handleRunPayroll} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Payroll Period
              </label>
              <input
                type="number"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-4 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="1"
                disabled={!canSubmit || submitting}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition font-medium"
            >
              {submitting ? 'Processing...' : 'Run Payroll'}
            </button>
          </form>
        </div>

        {/* Deposit to Escrow Form */}
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Deposit to Escrow</h3>
          <form onSubmit={handleDepositEscrow} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Amount (USDC)
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-4 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="1000"
                disabled={!canSubmit || submitting}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition font-medium"
            >
              {submitting ? 'Processing...' : 'Deposit to Escrow'}
            </button>
          </form>
        </div>
      </div>

      {/* Recent Blockchain Transactions */}
      {recentTransactions.length > 0 && (
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Recent Blockchain Transactions</h3>
          <div className="space-y-3">
            {recentTransactions.slice(-3).reverse().map((tx) => {
              const explorerLink = `${EXPLORER_URL}/tx/${tx.txHash}`;
              
              return (
                <div
                  key={tx.txHash}
                  className={`rounded-lg border p-4 ${
                    tx.status === 'success' ? 'border-green-800 bg-green-900/20' :
                    tx.status === 'failed' ? 'border-red-800 bg-red-900/20' :
                    'border-yellow-800 bg-yellow-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium">
                      {tx.status === 'success' ? '✓ CONFIRMED' : tx.status === 'failed' ? '✕ FAILED' : '⏳ PENDING'}
                    </p>
                    {tx.status === 'pending' && pollingTx === tx.txHash && (
                      <span className="text-xs text-yellow-400 animate-pulse">Polling...</span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-gray-400 break-all mb-2">
                    {tx.txHash}
                  </p>
                  {tx.error && (
                    <p className="text-xs text-red-400 mt-2">{tx.error}</p>
                  )}
                  <a
                    href={explorerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline"
                  >
                    View on Stellar Explorer →
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!canSubmit && !checkingRegistration && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
          <p className="text-sm text-yellow-400">
            {walletAddress
              ? !CONTRACT_ID
                ? 'Set NEXT_PUBLIC_CONTRACT_ID before submitting payroll actions.'
                : 'Register employer on-chain to enable payroll actions.'
              : 'Connect wallet to continue.'}
          </p>
        </div>
      )}
    </div>
  );
}
