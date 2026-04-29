export type DashboardTab = 'overview' | 'payroll' | 'team' | 'ledger' | 'cashout';

export interface DashboardStats {
  escrowBalance: string;
  totalEmployees: number;
  payrollPeriodsCompleted: number;
  pendingClaims: number;
}

export interface EmployeeWithKYC {
  employee_address: string;
  salary: bigint | string;
  currency: string;
  kyc_status: 'not_started' | 'pending' | 'approved' | 'rejected';
  kyc_level: 'tier_0' | 'tier_1' | 'tier_2';
  name: string;
  email?: string | null;
  created_at?: string;
}

export interface PayrollPeriodRecord {
  period_id: number;
  total_amount: bigint | string;
  is_claimed: boolean;
  created_at: string;
  tx_hash?: string;
}

export interface TransactionRecord {
  id: string;
  tx_hash: string;
  stellar_address: string;
  action_type: string;
  amount?: string;
  currency?: string;
  status: 'pending' | 'success' | 'failed';
  ledger_number?: number;
  created_at: string;
}

export interface KYCStatus {
  stellar_address: string;
  type: 'employer' | 'employee';
  kyc_status: 'not_started' | 'pending' | 'approved' | 'rejected' | 'revoked';
  kyc_level: 'tier_0' | 'tier_1' | 'tier_2';
  first_name?: string;
  last_name?: string;
  email?: string;
  country?: string;
}

export interface CashOutTransaction {
  id: string;
  moneygram_reference: string;
  sender_stellar_account: string;
  receiver_name: string;
  receiver_country: string;
  crypto_amount: string;
  crypto_currency: string;
  fiat_currency: string;
  fiat_amount?: string;
  status: string;
  tracking_number?: string;
  pin_code?: string;
  created_at: string;
  updated_at: string;
}
