'use client';

import { useEffect, useMemo, useState } from 'react';
import { PayrollContract } from '@/utils/contract';
import { 
  pollTransactionStatus, 
  formatTransactionStatus, 
  getStatusColor,
  TransactionInfo 
} from '@/utils/transactionStatus';

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org';
const EXPLORER_URL = 'https://stellar.expert/explorer/testnet';

type WorkerDashboardProps = {
  workerAddress: string | null;
  isWalletConnected: boolean;
};

export default function WorkerDashboard({
  workerAddress,
  isWalletConnected,
}: WorkerDashboardProps) {
  const payrollContract = useMemo(() => new PayrollContract(CONTRACT_ID, RPC_URL), []);

  const [employerAddress, setEmployerAddress] = useState('');
  const [period, setPeriod] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [employeeData, setEmployeeData] = useState<{
    salary: bigint;
    currency: string;
  } | null>(null);
  const [payrollPeriod, setPayrollPeriod] = useState<{
    period_id: number;
    total_amount: bigint;
    is_claimed: boolean;
  } | null>(null);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Transaction status tracking
  const [claimTxStatus, setClaimTxStatus] = useState<TransactionInfo | null>(null);
  const [pollingClaim, setPollingClaim] = useState(false);

  const isReady = Boolean(isWalletConnected && workerAddress && CONTRACT_ID);

  useEffect(() => {
    let cancelled = false;

    const loadEmployeeStatus = async () => {
      if (!isReady || !workerAddress || !employerAddress) {
        setCheckingStatus(false);
        setEmployeeData(null);
        setPayrollPeriod(null);
        return;
      }

      setCheckingStatus(true);
      setError(null);

      try {
        // Fetch employee data
        const emp = await payrollContract.getEmployee(employerAddress, workerAddress);
        if (cancelled) return;
        
        if (emp) {
          setEmployeeData({
            salary: emp.salary,
            currency: emp.currency,
          });
        } else {
          setEmployeeData(null);
        }

        // Fetch payroll period if period is specified
        if (period) {
          const parsedPeriod = parseInt(period, 10);
          if (!isNaN(parsedPeriod)) {
            const periodData = await payrollContract.getPayrollPeriod(employerAddress, parsedPeriod);
            if (cancelled) return;
            setPayrollPeriod(periodData);
          }
        }
      } catch (err: unknown) {
        console.error('Failed to fetch employee status:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch employee data');
        }
      } finally {
        if (!cancelled) {
          setCheckingStatus(false);
        }
      }
    };

    void loadEmployeeStatus();

    return () => {
      cancelled = true;
    };
  }, [workerAddress, employerAddress, period, isReady, payrollContract]);

  const handleClaimPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setClaimTxHash(null);
    setClaimTxStatus(null);

    try {
      const parsedPeriod = parseInt(period, 10);
      if (isNaN(parsedPeriod)) {
        throw new Error('Payroll period must be a valid number.');
      }

      if (!workerAddress || !employerAddress) {
        throw new Error('Worker and employer addresses are required.');
      }

      const response = await payrollContract.claimPayroll(
        workerAddress,
        employerAddress,
        parsedPeriod
      );

      const txHash = response.txHash || null;
      setClaimTxHash(txHash);

      // Start polling for transaction confirmation
      if (txHash) {
        setPollingClaim(true);
        try {
          const finalStatus = await pollTransactionStatus(txHash, RPC_URL, {
            intervalMs: 2000,
            maxAttempts: 30,
            onStatusChange: (status) => {
              setClaimTxStatus(status);
            },
          });

          if (finalStatus.status === 'success') {
            // Refresh payroll status after successful claim
            const periodData = await payrollContract.getPayrollPeriod(employerAddress, parsedPeriod);
            setPayrollPeriod(periodData);
          }
        } finally {
          setPollingClaim(false);
        }
      }
      
      alert(`Payroll claimed successfully!${txHash ? `\nTx: ${txHash}` : ''}`);
    } catch (err: unknown) {
      console.error('Error claiming payroll:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim payroll');
    } finally {
      setLoading(false);
    }
  };

  const explorerLink = claimTxHash ? `${EXPLORER_URL}/tx/${claimTxHash}` : null;

  if (!isWalletConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Worker Dashboard</h2>
          <p className="text-gray-600">Connect your wallet to view and claim payroll.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Worker Dashboard</h2>

        <div className="mb-8 rounded-lg border border-gray-200 p-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Connected Worker Wallet</p>
          <p className="font-mono text-sm text-gray-800 break-all">{workerAddress}</p>
        </div>

        {/* Employer Address Input */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Check Payroll Status</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employer Address
              </label>
              <input
                type="text"
                value={employerAddress}
                onChange={(e) => setEmployerAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="G... (Employer's Stellar address)"
                disabled={!isReady || checkingStatus}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payroll Period
              </label>
              <input
                type="number"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1"
                disabled={!isReady || checkingStatus}
                required
              />
            </div>
          </div>
        </div>

        {/* Status Display */}
        {checkingStatus && (
          <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
            <p className="font-medium">Checking payroll status...</p>
          </div>
        )}

        {error && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {employeeData && (
          <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4">
            <h4 className="font-semibold text-green-800 mb-2">Employee Information</h4>
            <div className="space-y-1 text-sm text-green-700">
              <p>
                <span className="font-medium">Salary:</span>{' '}
                {(Number(employeeData.salary) / 10_000_000).toFixed(2)} {employeeData.currency}
              </p>
            </div>
          </div>
        )}

        {payrollPeriod && (
          <div className="mb-8 rounded-lg border border-purple-200 bg-purple-50 p-4">
            <h4 className="font-semibold text-purple-800 mb-2">Payroll Period #{payrollPeriod.period_id}</h4>
            <div className="space-y-1 text-sm text-purple-700">
              <p>
                <span className="font-medium">Total Amount:</span>{' '}
                {(Number(payrollPeriod.total_amount) / 10_000_000).toFixed(2)} USDC
              </p>
              <p>
                <span className="font-medium">Status:</span>{' '}
                {payrollPeriod.is_claimed ? (
                  <span className="text-green-600 font-semibold">✓ Claimed</span>
                ) : (
                  <span className="text-amber-600 font-semibold">⏳ Ready to Claim</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Claim Form */}
        {employeeData && payrollPeriod && !payrollPeriod.is_claimed && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Claim Payroll</h3>
            <form onSubmit={handleClaimPayroll} className="space-y-4">
              <button
                type="submit"
                disabled={loading || checkingStatus}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
              >
                {loading ? 'Processing Claim...' : `Claim ${(Number(employeeData.salary) / 10_000_000).toFixed(2)} ${employeeData.currency}`}
              </button>
            </form>
          </div>
        )}

        {/* Transaction Success */}
        {claimTxHash && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Claim Transaction Status</h3>
            
            {claimTxStatus ? (
              <div
                className={`rounded-lg border p-4 ${getStatusColor(claimTxStatus.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">
                    {formatTransactionStatus(claimTxStatus.status)}
                  </p>
                  {claimTxStatus.status === 'pending' && pollingClaim && (
                    <span className="text-xs animate-pulse">Polling...</span>
                  )}
                </div>
                <p className="text-xs font-mono break-all mb-2 opacity-75">
                  {claimTxHash}
                </p>
                {claimTxStatus.error && (
                  <p className="text-xs mt-2 opacity-75">{claimTxStatus.error}</p>
                )}
                {claimTxStatus.ledger && (
                  <p className="text-xs mt-2">
                    <span className="font-medium">Ledger:</span> {claimTxStatus.ledger}
                  </p>
                )}
                <a
                  href={explorerLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  View on Stellar Explorer →
                </a>
              </div>
            ) : (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h4 className="font-semibold text-green-800 mb-2">✓ Claim Successful!</h4>
                <p className="text-sm text-green-700 mb-2">Transaction Hash:</p>
                <p className="text-xs font-mono break-all bg-white p-2 rounded border border-green-200">
                  {claimTxHash}
                </p>
                {explorerLink && (
                  <a
                    href={explorerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    View on Stellar Explorer →
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {!isReady && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            {!CONTRACT_ID
              ? 'Set NEXT_PUBLIC_CONTRACT_ID in your environment variables.'
              : 'Enter employer address and period to check your payroll status.'}
          </p>
        )}
      </div>
    </div>
  );
}
