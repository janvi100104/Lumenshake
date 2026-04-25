'use client';

import { useEffect, useMemo, useState } from 'react';
import { PayrollContract } from '@/utils/contract';

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc-futurenet.stellar.org';

type EmployerDashboardProps = {
  employerAddress: string | null;
  isWalletConnected: boolean;
};

export default function EmployerDashboard({
  employerAddress,
  isWalletConnected,
}: EmployerDashboardProps) {
  const payrollContract = useMemo(() => new PayrollContract(CONTRACT_ID, RPC_URL), []);

  const [employeeAddress, setEmployeeAddress] = useState('');
  const [salary, setSalary] = useState('');
  const [period, setPeriod] = useState('');
  const [loading, setLoading] = useState(false);
  const [kycHash, setKycHash] = useState('');
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [isEmployerRegistered, setIsEmployerRegistered] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationTxHash, setRegistrationTxHash] = useState<string | null>(null);

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

  const handleRegisterEmployer = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationLoading(true);

    try {
      const activeEmployer = getEmployerAddress();
      const response = await payrollContract.registerEmployer(activeEmployer, kycHash);
      const txMessage = response.txHash
        ? `\nTx: ${response.txHash}`
        : '';

      alert(`Employer registered successfully!${txMessage}`);
      setRegistrationTxHash(response.txHash || null);
      setIsEmployerRegistered(true);
      setKycHash('');
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

      const txMessage = response.txHash
        ? `\nTx: ${response.txHash}`
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
      const txMessage = response.txHash
        ? `\nTx: ${response.txHash}`
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
