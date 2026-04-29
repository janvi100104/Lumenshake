import { useState, useEffect, useCallback } from 'react';
import { PayrollContract } from '@/utils/contract';
import { EmployeeWithKYC, KYCStatus, TransactionRecord, DashboardStats } from '@/types/dashboard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org';

export function useEscrowBalance() {
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!CONTRACT_ID) {
      setLoading(false);
      return;
    }

    try {
      const payrollContract = new PayrollContract(CONTRACT_ID, RPC_URL);
      const bal = await payrollContract.getEscrowBalance();
      setBalance((Number(bal) / 10_000_000).toFixed(2));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch escrow balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return { balance, loading, error, refetch: fetchBalance };
}

export function useKYCStatus(walletAddress: string | null) {
  const [kycData, setKycData] = useState<KYCStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    const fetchKYC = async () => {
      try {
        const token = localStorage.getItem('sep10_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/customer`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const result = await response.json();
        if (result.success) {
          setKycData(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch KYC status:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch KYC');
      } finally {
        setLoading(false);
      }
    };

    fetchKYC();
  }, [walletAddress]);

  return { kycData, loading, error };
}

export function useTransactionHistory(address: string | null, limit: number = 50) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        const response = await fetch(`${API_URL}/payroll/transactions/${address}?limit=${limit}`);
        const result = await response.json();
        
        if (result.success) {
          setTransactions(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [address, limit]);

  return { transactions, loading, error };
}

export function useEmployees(employerAddress: string | null) {
  const [employees, setEmployees] = useState<EmployeeWithKYC[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    if (!employerAddress || !CONTRACT_ID) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching employees for:', employerAddress);
      
      const response = await fetch(`${API_URL}/payroll/employers/${employerAddress}/employees`);
      const result = await response.json();
      
      console.log('Employees API response:', result);
      
      if (result.success && result.data && result.data.length > 0) {
        console.log('Found', result.data.length, 'employees');
        setEmployees(result.data);
      } else {
        console.log('No employees found in database');
        setEmployees([]);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [employerAddress]);

  useEffect(() => {
    fetchEmployees();
    // Poll every 10 seconds to catch new employees
    const interval = setInterval(fetchEmployees, 10000);
    return () => clearInterval(interval);
  }, [fetchEmployees]);

  return { employees, loading, error, refetch: fetchEmployees };
}

export function useDashboardStats(walletAddress: string | null, userRole: 'employer' | 'worker' | null) {
  const [stats, setStats] = useState<DashboardStats>({
    escrowBalance: '0',
    totalEmployees: 0,
    payrollPeriodsCompleted: 0,
    pendingClaims: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!walletAddress || !userRole) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        // Fetch escrow balance
        const payrollContract = new PayrollContract(CONTRACT_ID, RPC_URL);
        const balance = await payrollContract.getEscrowBalance();
        const escrowBalance = (Number(balance) / 10_000_000).toFixed(2);

        // Fetch transactions to calculate stats
        const response = await fetch(`${API_URL}/payroll/transactions/${walletAddress}?limit=100`);
        const result = await response.json();

        let totalEmployees = 0;
        let payrollPeriodsCompleted = 0;
        let pendingClaims = 0;

        if (result.success && result.data) {
          const transactions = result.data;
          
          // Count unique employees
          const uniqueEmployees = new Set(
            transactions
              .filter((t: any) => t.action_type === 'add_employee')
              .map((t: any) => t.stellar_address)
          );
          totalEmployees = uniqueEmployees.size;

          // Count completed payroll periods
          payrollPeriodsCompleted = transactions.filter(
            (t: any) => t.action_type === 'run_payroll' && t.status === 'success'
          ).length;

          // Count pending claims
          pendingClaims = transactions.filter(
            (t: any) => t.action_type === 'claim_payroll' && t.status === 'pending'
          ).length;
        }

        setStats({
          escrowBalance,
          totalEmployees,
          payrollPeriodsCompleted,
          pendingClaims,
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [walletAddress, userRole]);

  return { stats, loading };
}
