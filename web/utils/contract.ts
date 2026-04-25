import { contract } from '@stellar/stellar-sdk';
import { signTransaction as freighterSignTransaction } from '@stellar/freighter-api';

const FUTURENET_PASSPHRASE = 'Test SDF Future Network ; October 2022';
const PUBLIC_NETWORK_PASSPHRASE = 'Public Global Stellar Network ; September 2015';
const ACCOUNT_NOT_FOUND_PATTERN = /Account not found:\s*([A-Z0-9]+)/i;

const getFriendbotUrl = (address: string): string => {
  return `https://friendbot.stellar.org/?addr=${address}`;
};

const prettifyPassphrase = (networkPassphrase: string): string => {
  if (networkPassphrase === FUTURENET_PASSPHRASE) {
    return 'Futurenet';
  }

  if (networkPassphrase === PUBLIC_NETWORK_PASSPHRASE) {
    return 'Mainnet';
  }

  return networkPassphrase;
};

type ContractResult<T> = {
  txHash: string;
  result: T;
};

export interface Employee {
  address: string;
  salary: bigint;
  currency: string;
}

export interface Employer {
  address: string;
  kyc_hash: unknown;
  is_paused: boolean;
}

export interface PayrollPeriod {
  period_id: number;
  total_amount: bigint;
  is_claimed: boolean;
}

type PayrollClient = contract.Client & {
  register_employer: (args: {
    employer: string;
    kyc_hash: Uint8Array;
  }) => Promise<contract.AssembledTransaction<unknown>>;
  add_employee: (args: {
    employer: string;
    employee: string;
    amount: bigint;
    currency: string;
  }) => Promise<contract.AssembledTransaction<unknown>>;
  run_payroll: (args: {
    employer: string;
    period: bigint;
  }) => Promise<contract.AssembledTransaction<unknown>>;
  claim_payroll: (args: {
    employee: string;
    employer: string;
    period: bigint;
  }) => Promise<contract.AssembledTransaction<unknown>>;
  get_employer: (args: {
    employer: string;
  }) => Promise<contract.AssembledTransaction<Employer | null>>;
  get_employee: (args: {
    employer: string;
    employee: string;
  }) => Promise<contract.AssembledTransaction<Employee | null>>;
  get_payroll_period: (args: {
    employer: string;
    period: bigint;
  }) => Promise<contract.AssembledTransaction<PayrollPeriod | null>>;
};

const signWithFreighter: contract.SignTransaction = async (transactionXdr, opts) => {
  return freighterSignTransaction(transactionXdr, {
    networkPassphrase: opts?.networkPassphrase,
    address: opts?.address,
  });
};

const normalizeError = (
  error: unknown,
  networkPassphrase: string = FUTURENET_PASSPHRASE
): string => {
  const message =
    error instanceof Error && error.message
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unexpected contract error.';

  const match = message.match(ACCOUNT_NOT_FOUND_PATTERN);
  if (!match) {
    return message;
  }

  const missingAddress = match[1];
  const networkName = prettifyPassphrase(networkPassphrase);
  const isMainnet = networkPassphrase === PUBLIC_NETWORK_PASSPHRASE;

  if (isMainnet) {
    return [
      `Account not found on ${networkName}: ${missingAddress}.`,
      'This wallet address has no account on Mainnet yet.',
      'Switch Freighter to the intended network or create/fund this account on Mainnet before retrying.',
    ].join('\n');
  }

  return [
    `Account not found on ${networkName}: ${missingAddress}.`,
    'Your connected wallet is likely unfunded on this network, or Freighter is on a different network.',
    `Fund it with Friendbot: ${getFriendbotUrl(missingAddress)}`,
    'Then retry the transaction.',
  ].join('\n');
};

const parsePositiveInteger = (value: string | number | bigint, label: string): bigint => {
  try {
    const parsed = BigInt(value);
    if (parsed <= BigInt(0)) {
      throw new Error(`${label} must be greater than zero.`);
    }
    return parsed;
  } catch {
    throw new Error(`${label} must be a valid integer.`);
  }
};

const isResultLike = (value: unknown): value is {
  isErr: () => boolean;
  unwrapErr: () => { message?: string };
} => {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'isErr' in value &&
      typeof (value as { isErr: unknown }).isErr === 'function' &&
      'unwrapErr' in value &&
      typeof (value as { unwrapErr: unknown }).unwrapErr === 'function'
  );
};

const assertContractResult = (value: unknown, action: string) => {
  if (!isResultLike(value)) {
    return;
  }

  if (value.isErr()) {
    const err = value.unwrapErr();
    throw new Error(err.message || `${action} failed in smart contract.`);
  }
};

const hexToBytes = (hex: string): Uint8Array => {
  const cleaned = hex.toLowerCase();
  const output = new Uint8Array(32);

  for (let i = 0; i < 32; i += 1) {
    const index = i * 2;
    output[i] = Number.parseInt(cleaned.slice(index, index + 2), 16);
  }

  return output;
};

const toBytes32 = async (value: string): Promise<Uint8Array> => {
  const trimmed = value.trim();
  if (!trimmed) {
    return new Uint8Array(32);
  }

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return hexToBytes(trimmed);
  }

  if (!globalThis.crypto?.subtle) {
    throw new Error('Unable to hash KYC value in this environment.');
  }

  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(trimmed)
  );
  return new Uint8Array(digest);
};

export class PayrollContract {
  private contractId: string;
  private rpcUrl: string;
  private networkPassphrase: string;

  constructor(contractId: string, rpcUrl: string = 'https://rpc-futurenet.stellar.org') {
    this.contractId = contractId;
    this.rpcUrl = rpcUrl;
    this.networkPassphrase =
      process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || FUTURENET_PASSPHRASE;
  }

  private async getClient(publicKey?: string): Promise<PayrollClient> {
    if (!this.contractId) {
      throw new Error('Contract ID is missing. Set NEXT_PUBLIC_CONTRACT_ID.');
    }

    const client = await contract.Client.from({
      contractId: this.contractId,
      rpcUrl: this.rpcUrl,
      networkPassphrase: this.networkPassphrase,
      publicKey,
      signTransaction: signWithFreighter,
      allowHttp: this.rpcUrl.startsWith('http://'),
    });

    return client as PayrollClient;
  }

  async registerEmployer(employerAddress: string, kycHash: string): Promise<ContractResult<unknown>> {
    try {
      const client = await this.getClient(employerAddress);
      const kycHashBytes = await toBytes32(kycHash);
      const tx = await client.register_employer({
        employer: employerAddress,
        kyc_hash: kycHashBytes,
      });

      const sentTx = await tx.signAndSend();
      assertContractResult(sentTx.result, 'Employer registration');

      return {
        txHash: sentTx.sendTransactionResponse?.hash || '',
        result: sentTx.result,
      };
    } catch (error: unknown) {
      throw new Error(normalizeError(error, this.networkPassphrase));
    }
  }

  async addEmployee(
    employerAddress: string,
    employeeAddress: string,
    amount: string,
    currency: string
  ): Promise<ContractResult<unknown>> {
    try {
      const client = await this.getClient(employerAddress);
      const parsedAmount = parsePositiveInteger(amount, 'Salary amount');
      const tx = await client.add_employee({
        employer: employerAddress,
        employee: employeeAddress,
        amount: parsedAmount,
        currency,
      });

      const sentTx = await tx.signAndSend();
      assertContractResult(sentTx.result, 'Add employee');

      return {
        txHash: sentTx.sendTransactionResponse?.hash || '',
        result: sentTx.result,
      };
    } catch (error: unknown) {
      throw new Error(normalizeError(error, this.networkPassphrase));
    }
  }

  async runPayroll(employerAddress: string, period: number): Promise<ContractResult<unknown>> {
    try {
      const client = await this.getClient(employerAddress);
      const parsedPeriod = parsePositiveInteger(period, 'Payroll period');
      const tx = await client.run_payroll({
        employer: employerAddress,
        period: parsedPeriod,
      });

      const sentTx = await tx.signAndSend();
      assertContractResult(sentTx.result, 'Run payroll');

      return {
        txHash: sentTx.sendTransactionResponse?.hash || '',
        result: sentTx.result,
      };
    } catch (error: unknown) {
      throw new Error(normalizeError(error, this.networkPassphrase));
    }
  }

  async claimPayroll(
    employeeAddress: string,
    employerAddress: string,
    period: number
  ): Promise<ContractResult<unknown>> {
    try {
      const client = await this.getClient(employeeAddress);
      const parsedPeriod = parsePositiveInteger(period, 'Payroll period');
      const tx = await client.claim_payroll({
        employee: employeeAddress,
        employer: employerAddress,
        period: parsedPeriod,
      });

      const sentTx = await tx.signAndSend();
      assertContractResult(sentTx.result, 'Claim payroll');

      return {
        txHash: sentTx.sendTransactionResponse?.hash || '',
        result: sentTx.result,
      };
    } catch (error: unknown) {
      throw new Error(normalizeError(error, this.networkPassphrase));
    }
  }

  async getEmployer(employerAddress: string): Promise<Employer | null> {
    try {
      const client = await this.getClient();
      const tx = await client.get_employer({ employer: employerAddress });
      return tx.result;
    } catch (error: unknown) {
      throw new Error(normalizeError(error, this.networkPassphrase));
    }
  }

  async getEmployee(employerAddress: string, employeeAddress: string): Promise<Employee | null> {
    try {
      const client = await this.getClient();
      const tx = await client.get_employee({
        employer: employerAddress,
        employee: employeeAddress,
      });
      return tx.result;
    } catch (error: unknown) {
      throw new Error(normalizeError(error, this.networkPassphrase));
    }
  }

  async getPayrollPeriod(employerAddress: string, period: number): Promise<PayrollPeriod | null> {
    try {
      const client = await this.getClient();
      const parsedPeriod = parsePositiveInteger(period, 'Payroll period');
      const tx = await client.get_payroll_period({
        employer: employerAddress,
        period: parsedPeriod,
      });
      return tx.result;
    } catch (error: unknown) {
      throw new Error(normalizeError(error, this.networkPassphrase));
    }
  }
}
