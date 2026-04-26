'use client';

import { useEffect, useMemo, useState } from 'react';
import { PayrollContract } from '@/utils/contract';
import { 
  pollTransactionStatus, 
  formatTransactionStatus, 
  getStatusColor,
  TransactionInfo 
} from '@/utils/transactionStatus';
import { useToast } from '@/components/Toast';

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
const EXPLORER_URL = 'https://stellar.expert/explorer/testnet';

type EmployerDashboardProps = {
  employerAddress: string | null;
  isWalletConnected: boolean;
};

export default function EmployerDashboard({
  employerAddress,
  isWalletConnected,
}: EmployerDashboardProps) {
  const payrollContract = useMemo(() => new PayrollContract(CONTRACT_ID, RPC_URL), []);
  const toast = useToast();

  const [employeeAddress, setEmployeeAddress] = useState('');
  const [salary, setSalary] = useState('');
  const [period, setPeriod] = useState('');
  const [loading, setLoading] = useState(false);
  const [kycHash, setKycHash] = useState('');
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [isEmployerRegistered, setIsEmployerRegistered] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationTxHash, setRegistrationTxHash] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [escrowBalance, setEscrowBalance] = useState<string>('0');
  
  // Transaction status tracking
  const [recentTransactions, setRecentTransactions] = useState<TransactionInfo[]>([]);
  const [pollingTx, setPollingTx] = useState<string | null>(null);

  const isReadyToCheckRegistration = Boolean(isWalletConnected && employerAddress && CONTRACT_ID);
  const canSubmit = Boolean(
    isWalletConnected &&
      employerAddress &&
      CONTRACT_ID &&
      isEmployerRegistered &&
      !checkingRegistration
  );

  const getEmployerAddress = (): string => {
    if (!CONTRACT_ID) {
      throw new Error('Contract ID is missing. Set NEXT_PUBLIC_CONTRACT_ID.');
    }

    if (!isWalletConnected || !employerAddress) {
      throw new Error('Connect your Freighter wallet first.');
    }

    return employerAddress;
  };

  // Start polling for transaction status
  const startTransactionPolling = async (txHash: string, actionName: string) => {
    setPollingTx(txHash);
    
    try {
      const finalStatus = await pollTransactionStatus(txHash, RPC_URL, {
        intervalMs: 2000,
        maxAttempts: 30,
        onStatusChange: (status) => {
          // Update recent transactions list
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

      // Show notification based on final status
      if (finalStatus.status === 'success') {
        console.log(`✅ ${actionName} confirmed on-chain`);
      } else if (finalStatus.status === 'failed') {
        console.error(`❌ ${actionName} failed:`, finalStatus.error);
      }
    } catch (error) {
      console.error(`Error polling ${actionName}:`, error);
    } finally {
      setPollingTx(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadEmployerStatus = async () => {
      if (!isReadyToCheckRegistration || !employerAddress) {
        setCheckingRegistration(false);
        setIsEmployerRegistered(false);
        setRegistrationTxHash(null);
        return;
      }

      setCheckingRegistration(true);
      try {
        const employer = await payrollContract.getEmployer(employerAddress);
        if (cancelled) {
          return;
        }
        setIsEmployerRegistered(Boolean(employer));
      } catch (error: unknown) {
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

    void loadEmployerStatus();

    return () => {
      cancelled = true;
    };
  }, [employerAddress, isReadyToCheckRegistration, payrollContract]);

  useEffect(() => {
    let cancelled = false;

    const loadEscrowBalance = async () => {
      if (!CONTRACT_ID) {
        return;
      }

      try {
        const balance = await payrollContract.getEscrowBalance();
        if (!cancelled) {
          // Convert from stroops (7 decimals for USDC) to human-readable
          setEscrowBalance((Number(balance) / 10_000_000).toFixed(2));
        }
      } catch (error: unknown) {
        console.error('Failed to fetch escrow balance:', error);
      }
    };

    void loadEscrowBalance();

    return () => {
      cancelled = true;
    };
  }, [payrollContract]);

  const handleRegisterEmployer = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationLoading(true);

    try {
      const activeEmployer = getEmployerAddress();
      const response = await payrollContract.registerEmployer(activeEmployer, kycHash);
      const txHash = response.txHash || null;
      
      setRegistrationTxHash(txHash);
      setIsEmployerRegistered(true);
      setKycHash('');

      // Start polling for transaction confirmation
      if (txHash) {
        startTransactionPolling(txHash, 'Employer Registration');
      }

      const txMessage = txHash
        ? `\nTx: ${txHash}`
        : '';

      alert(`Employer registered successfully!${txMessage}`);
    } catch (error: unknown) {
      console.error('Error registering employer:', error);
      const message = error instanceof Error ? error.message : 'Failed to register employer';
      alert(message);
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const activeEmployer = getEmployerAddress();
      const response = await payrollContract.addEmployee(
        activeEmployer,
        employeeAddress,
        salary,
        'USDC'
      );

      const txHash = response.txHash || null;

      // Start polling for transaction confirmation
      if (txHash) {
        startTransactionPolling(txHash, 'Add Employee');
      }

      const txMessage = txHash
        ? `\nTx: ${txHash}`
        : '';

      alert(`Employee added successfully!${txMessage}`);
      setEmployeeAddress('');
      setSalary('');
    } catch (error: unknown) {
      console.error('Error adding employee:', error);
      const message = error instanceof Error ? error.message : 'Failed to add employee';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const parsedPeriod = Number.parseInt(period, 10);
      if (Number.isNaN(parsedPeriod)) {
        throw new Error('Payroll period must be a valid number.');
      }

      const activeEmployer = getEmployerAddress();
      const response = await payrollContract.runPayroll(activeEmployer, parsedPeriod);
      const txHash = response.txHash || null;

      // Start polling for transaction confirmation
      if (txHash) {
        startTransactionPolling(txHash, 'Run Payroll');
      }

      const txMessage = txHash
        ? `\nTx: ${txHash}`
        : '';

      alert(`Payroll executed successfully!${txMessage}`);
      setPeriod('');
    } catch (error: unknown) {
      console.error('Error running payroll:', error);
      const message = error instanceof Error ? error.message : 'Failed to run payroll';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const activeEmployer = getEmployerAddress();
      const response = await payrollContract.depositEscrow(activeEmployer, depositAmount);
      const txHash = response.txHash || null;

      // Start polling for transaction confirmation
      if (txHash) {
        startTransactionPolling(txHash, 'Deposit Escrow');
      }

      const txMessage = txHash
        ? `\nTx: ${txHash}`
        : '';

      alert(`Successfully deposited ${depositAmount} USDC to escrow!${txMessage}`);
      setDepositAmount('');
      
      // Refresh escrow balance
      const balance = await payrollContract.getEscrowBalance();
      setEscrowBalance((Number(balance) / 10_000_000).toFixed(2));
    } catch (error: unknown) {
      console.error('Error depositing to escrow:', error);
      const message = error instanceof Error ? error.message : 'Failed to deposit to escrow';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Employer Dashboard</h2>

        <div className="mb-8 rounded-lg border border-gray-200 p-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Connected Employer Wallet</p>
          <p className="font-mono text-sm text-gray-800 break-all">
            {employerAddress || 'Not connected'}
          </p>
        </div>

        {/* Escrow Balance */}
        <div className="mb-8 rounded-lg border border-blue-200 p-4 bg-blue-50">
          <p className="text-sm text-blue-600 mb-2">Escrow Balance</p>
          <p className="text-3xl font-bold text-blue-800">{escrowBalance} USDC</p>
          <p className="text-xs text-blue-600 mt-2">
            Funds available for payroll distribution
          </p>
        </div>

        {/* Transaction Status Monitor */}
        {recentTransactions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {recentTransactions.slice(-5).reverse().map((tx) => {
                const statusColor = getStatusColor(tx.status);
                const explorerLink = `${EXPLORER_URL}/tx/${tx.txHash}`;
                
                return (
                  <div
                    key={tx.txHash}
                    className={`rounded-lg border p-4 ${statusColor}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">
                        {formatTransactionStatus(tx.status)}
                      </p>
                      {tx.status === 'pending' && pollingTx === tx.txHash && (
                        <span className="text-xs animate-pulse">Polling...</span>
                      )}
                    </div>
                    <p className="text-xs font-mono break-all mb-2 opacity-75">
                      {tx.txHash}
                    </p>
                    {tx.error && (
                      <p className="text-xs mt-2 opacity-75">{tx.error}</p>
                    )}
                    <a
                      href={explorerLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline hover:opacity-75"
                    >
                      View on Stellar Explorer →
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Employer Registration */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Employer Registration</h3>
          {checkingRegistration ? (
            <p className="text-sm text-gray-600">Checking on-chain registration status...</p>
          ) : isEmployerRegistered ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
              <p className="font-medium">Employer is registered on-chain.</p>
              {registrationTxHash && (
                <p className="mt-2 text-xs font-mono break-all">
                  Tx: {registrationTxHash}
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleRegisterEmployer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KYC Hash / Reference
                </label>
                <input
                  type="text"
                  value={kycHash}
                  onChange={(e) => setKycHash(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional: 64-char hex or any reference text"
                  disabled={!isReadyToCheckRegistration || registrationLoading || loading}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Leave blank to use zero hash, enter 64-char hex, or plain text to hash locally.
                </p>
              </div>
              <button
                type="submit"
                disabled={!isReadyToCheckRegistration || registrationLoading || loading}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition font-medium"
              >
                {registrationLoading ? 'Registering...' : 'Register Employer'}
              </button>
            </form>
          )}
        </div>

        {/* Deposit to Escrow */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Deposit to Escrow</h3>
          <form onSubmit={handleDepositEscrow} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USDC)
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1000"
                disabled={!canSubmit || loading || registrationLoading}
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Deposit USDC to escrow for payroll distribution. You must have USDC in your wallet.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || registrationLoading || !canSubmit}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition font-medium"
            >
              {loading ? 'Depositing...' : 'Deposit to Escrow'}
            </button>
          </form>
        </div>

        {/* Add Employee Form */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Add Employee</h3>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Address
              </label>
              <input
                type="text"
                value={employeeAddress}
                onChange={(e) => setEmployeeAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="G..."
                disabled={!canSubmit || loading || registrationLoading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary (USDC)
              </label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1000"
                disabled={!canSubmit || loading || registrationLoading}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || registrationLoading || !canSubmit}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
            >
              {loading ? 'Processing...' : 'Add Employee'}
            </button>
          </form>
        </div>

        {/* Run Payroll Form */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Run Payroll</h3>
          <form onSubmit={handleRunPayroll} className="space-y-4">
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
                disabled={!canSubmit || loading || registrationLoading}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || registrationLoading || !canSubmit}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
            >
              {loading ? 'Processing...' : 'Run Payroll'}
            </button>
          </form>
        </div>

        {!canSubmit && !registrationLoading && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            {isWalletConnected
              ? !CONTRACT_ID
                ? 'Set NEXT_PUBLIC_CONTRACT_ID before submitting payroll actions.'
                : checkingRegistration
                  ? 'Checking employer registration status...'
                  : 'Register employer on-chain to enable payroll actions.'
              : 'Connect Freighter wallet to continue.'}
          </p>
        )}
      </div>
    </div>
  );
}
