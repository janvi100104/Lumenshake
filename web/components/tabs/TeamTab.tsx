'use client';

import { useState, useEffect } from 'react';
import { useEmployees } from '@/hooks/useDashboardData';
import { useToast } from '@/components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

type TeamTabProps = {
  walletAddress: string | null;
  userRole: 'employer' | 'worker' | null;
};

export default function TeamTab({ walletAddress, userRole }: TeamTabProps) {
  const { employees, loading, error, refetch } = useEmployees(walletAddress);
  const toast = useToast();
  
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployeeAddress, setNewEmployeeAddress] = useState('');
  const [newEmployeeSalary, setNewEmployeeSalary] = useState('');
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [isEmployerRegistered, setIsEmployerRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-900/50 text-green-400 border-green-700';
      case 'pending':
        return 'bg-yellow-900/50 text-yellow-400 border-yellow-700';
      case 'rejected':
        return 'bg-red-900/50 text-red-400 border-red-700';
      default:
        return 'bg-gray-900/50 text-gray-400 border-gray-700';
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress) {
      toast.error('Wallet not connected', 'Please connect your wallet first');
      return;
    }

    // Check if employer is registered
    if (!isEmployerRegistered) {
      toast.error('Employer not registered', 'Please register as an employer first');
      return;
    }

    setAddingEmployee(true);
    let txHash = '';
    try {
      const { PayrollContract } = await import('@/utils/contract');
      const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || '';
      const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org';
      
      const payrollContract = new PayrollContract(CONTRACT_ID, RPC_URL);
      const salaryInStroops = BigInt(Math.floor(parseFloat(newEmployeeSalary) * 10_000_000));
      
      // Step 1: Add employee to smart contract
      const response = await payrollContract.addEmployee(
        walletAddress,
        newEmployeeAddress,
        salaryInStroops.toString(),
        'USDC'
      );

      txHash = response.txHash || '';
      toast.success('Employee added to contract!', txHash ? `Tx: ${txHash}` : undefined);
      
      // Step 2: Log transaction to database for Ledger tab
      try {
        await fetch(`${API_URL}/payroll/log-transaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tx_hash: txHash,
            type: 'add_employee',
            stellar_address: newEmployeeAddress,
            amount: parseFloat(newEmployeeSalary),
            status: 'success',
            metadata: {
              employer_address: walletAddress,
              currency: 'USDC',
            },
          }),
        });
      } catch (logError) {
        console.error('Failed to log transaction:', logError);
      }
      
      // Step 3: Sync employee to database for Team tab display
      try {
        console.log('Syncing employee to database...', {
          employer_address: walletAddress,
          employee_address: newEmployeeAddress,
          salary: parseFloat(newEmployeeSalary),
          currency: 'USDC',
          tx_hash: txHash,
        });
        
        const insertResponse = await fetch(`${API_URL}/payroll/sync-employee`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employer_address: walletAddress,
            employee_address: newEmployeeAddress,
            salary: parseFloat(newEmployeeSalary),
            currency: 'USDC',
            tx_hash: txHash,
          }),
        });
        
        const insertResult = await insertResponse.json();
        console.log('Sync employee result:', insertResult);
        
        if (insertResult.success) {
          console.log('Employee synced to database successfully');
        } else {
          console.error('Sync failed:', insertResult.error);
        }
      } catch (dbError) {
        console.error('Failed to sync to backend DB:', dbError);
        // Don't fail the operation - employee is still on-chain
      }
      
      // Reset form and refresh
      setNewEmployeeAddress('');
      setNewEmployeeSalary('');
      setShowAddEmployee(false);
      
      // Force immediate refetch
      setTimeout(() => refetch(), 1000);
    } catch (err) {
      console.error('Error adding employee:', err);
      const message = err instanceof Error ? err.message : 'Failed to add employee';
      toast.error('Failed to add employee', message);
    } finally {
      setAddingEmployee(false);
    }
  };

  const handleRegisterEmployer = async () => {
    if (!walletAddress) {
      toast.error('Wallet not connected', 'Please connect your wallet first');
      return;
    }

    setRegistering(true);
    let txHash = '';
    try {
      const { PayrollContract } = await import('@/utils/contract');
      const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || '';
      const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org';
      
      const payrollContract = new PayrollContract(CONTRACT_ID, RPC_URL);
      
      // Generate a simple KYC hash (in production, this would come from SEP-12 KYC verification)
      const kycHash = '0000000000000000000000000000000000000000000000000000000000000001';
      
      const response = await payrollContract.registerEmployer(walletAddress, kycHash);
      
      txHash = response.txHash || '';
      toast.success('Employer registered successfully!', txHash ? `Tx: ${txHash}` : undefined);
      
      // Log transaction for Ledger tab
      if (txHash) {
        try {
          await fetch(`${API_URL}/payroll/log-transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tx_hash: txHash,
              type: 'register_employer',
              stellar_address: walletAddress,
              amount: 0,
              status: 'success',
            }),
          });
        } catch (logError) {
          console.error('Failed to log transaction:', logError);
        }
      }
      
      setIsEmployerRegistered(true);
    } catch (err) {
      console.error('Error registering employer:', err);
      const message = err instanceof Error ? err.message : 'Failed to register employer';
      
      // Check if already registered error
      if (message.includes('AlreadyRegistered') || message.includes('#1')) {
        toast.info('Already registered', 'Employer is already registered');
        setIsEmployerRegistered(true);
      } else {
        toast.error('Failed to register employer', message);
      }
    } finally {
      setRegistering(false);
    }
  };

  // Check employer registration status on mount
  useEffect(() => {
    let cancelled = false;

    const checkRegistration = async () => {
      if (!walletAddress) {
        setCheckingRegistration(false);
        setIsEmployerRegistered(false);
        return;
      }

      setCheckingRegistration(true);
      try {
        const { PayrollContract } = await import('@/utils/contract');
        const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || '';
        const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org';
        
        const payrollContract = new PayrollContract(CONTRACT_ID, RPC_URL);
        const employer = await payrollContract.getEmployer(walletAddress);
        
        if (!cancelled) {
          setIsEmployerRegistered(!!employer);
        }
      } catch (err) {
        console.error('Error checking employer status:', err);
        if (!cancelled) {
          setIsEmployerRegistered(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingRegistration(false);
        }
      }
    };

    checkRegistration();

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  if (userRole !== 'employer') {
    return (
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-12 text-center">
        <div className="text-6xl mb-4">👥</div>
        <h2 className="text-2xl font-bold text-white mb-4">Team Management</h2>
        <p className="text-gray-400">Only employers can view and manage team members</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Members</h2>
          <p className="text-gray-400 text-sm mt-1">{employees.length} total members</p>
        </div>
        <div className="flex space-x-3">
          {!isEmployerRegistered && !checkingRegistration && (
            <button
              onClick={handleRegisterEmployer}
              disabled={registering}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-700 transition text-sm font-medium"
            >
              {registering ? 'Registering...' : '+ Register Employer'}
            </button>
          )}
          {isEmployerRegistered && (
            <>
              <button className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition text-sm">
                + Run Payroll
              </button>
              <button
                onClick={() => setShowAddEmployee(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                + Add Member
              </button>
            </>
          )}
        </div>
      </div>

      {/* Registration Status Banner */}
      {!isEmployerRegistered && !checkingRegistration && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="text-yellow-400 text-xl">⚠️</div>
            <div className="flex-1">
              <h4 className="text-yellow-400 font-semibold mb-1">Employer Registration Required</h4>
              <p className="text-gray-300 text-sm mb-3">
                You need to register as an employer before you can add employees and run payroll.
                This links your wallet address to the payroll contract.
              </p>
              <button
                onClick={handleRegisterEmployer}
                disabled={registering}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-700 transition font-medium"
              >
                {registering ? 'Registering...' : 'Register Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {checkingRegistration && (
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Checking employer status...</p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Employee Table */}
        <div className="lg:col-span-2">
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading team members...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-400">Failed to load employees</p>
                <button onClick={refetch} className="mt-2 text-blue-400 hover:underline text-sm">
                  Retry
                </button>
              </div>
            ) : employees.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">👤</div>
                <p className="text-gray-400">No team members found</p>
                <button
                  onClick={() => setShowAddEmployee(true)}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  Add Your First Employee
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#252b3d] border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Country</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stellar Wallet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">KYC</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Salary/mo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Claim Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Next Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {employees.map((emp, index) => (
                      <tr key={emp.employee_address || index} className="hover:bg-[#252b3d] transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{emp.name || 'Unknown'}</div>
                          {emp.email && <div className="text-xs text-gray-500">{emp.email}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-300">Worker</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-300">🇺🇸 US</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-400">
                            {emp.employee_address.slice(0, 6)}...{emp.employee_address.slice(-4)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getKYCStatusColor(emp.kyc_status)}`}>
                            {emp.kyc_status === 'approved' ? '✓' : emp.kyc_status === 'pending' ? '⏳' : emp.kyc_status === 'rejected' ? '✕' : '○'}
                            <span className="ml-1">{emp.kyc_status.replace('_', ' ').toUpperCase()}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-white">
                            ${(Number(emp.salary) / 10_000_000).toFixed(0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-green-400">Claimed</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-400">Nov 28</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Blockchain Ops */}
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Blockchain Ops</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400 text-sm">On-chain payroll</span>
                <span className="text-green-400 text-sm">✓ Active</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400 text-sm">Workers</span>
                <span className="text-white text-sm font-semibold">{employees.length}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-400 text-sm">USDC distributed</span>
                <span className="text-white text-sm font-semibold">$58,400</span>
              </div>
            </div>
          </div>

          {/* MoneyGram Cash-Out Ready */}
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">MoneyGram Cash-Out Ready</h3>
            <div className="space-y-3">
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                <p className="text-blue-400 text-xs mb-1">APPROVED LOCATIONS</p>
                <p className="text-2xl font-bold text-white">15</p>
                <p className="text-gray-400 text-xs mt-1">Near your workers</p>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400 text-sm">SEP-24 anchors</span>
                <span className="text-green-400 text-sm">✓ Connected</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-400 text-sm">Cash-out fee</span>
                <span className="text-white text-sm">1.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Add Employee</h3>
              <button
                onClick={() => setShowAddEmployee(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Employee Stellar Address
                </label>
                <input
                  type="text"
                  value={newEmployeeAddress}
                  onChange={(e) => setNewEmployeeAddress(e.target.value)}
                  className="w-full px-4 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="G..."
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Salary (USDC)
                </label>
                <input
                  type="number"
                  value={newEmployeeSalary}
                  onChange={(e) => setNewEmployeeSalary(e.target.value)}
                  className="w-full px-4 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="1000"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddEmployee(false)}
                  className="flex-1 bg-[#252b3d] text-gray-300 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingEmployee}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-700 transition"
                >
                  {addingEmployee ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
