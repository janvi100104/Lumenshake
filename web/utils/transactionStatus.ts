import { SorobanRpc } from '@stellar/stellar-sdk';

export type TransactionStatus = 'pending' | 'success' | 'failed' | 'not_found';

export type TransactionInfo = {
  status: TransactionStatus;
  txHash: string;
  ledger?: number;
  createdAt?: string;
  resultMetaXdr?: string;
  error?: string;
};

/**
 * Fetch transaction status from Stellar RPC
 */
export const getTransactionStatus = async (
  txHash: string,
  rpcUrl: string = 'https://soroban-testnet.stellar.org'
): Promise<TransactionInfo> => {
  try {
    const server = new SorobanRpc.Server(rpcUrl);
    
    // Get transaction details
    const txResponse = await server.getTransaction(txHash);
    
    switch (txResponse.status) {
      case SorobanRpc.Api.GetTransactionStatus.SUCCESS:
        return {
          status: 'success',
          txHash,
          ledger: txResponse.ledger,
          createdAt: txResponse.createdAt?.toISOString(),
          resultMetaXdr: txResponse.resultMetaXdr,
        };
      
      case SorobanRpc.Api.GetTransactionStatus.FAILED:
        return {
          status: 'failed',
          txHash,
          ledger: txResponse.ledger,
          createdAt: txResponse.createdAt?.toISOString(),
          error: txResponse.resultXdr || 'Transaction failed',
        };
      
      case SorobanRpc.Api.GetTransactionStatus.NOT_FOUND:
      default:
        return {
          status: 'pending',
          txHash,
        };
    }
  } catch (error: unknown) {
    // If transaction not found yet, it's still pending
    if (error instanceof Error && error.message.includes('not found')) {
      return {
        status: 'pending',
        txHash,
      };
    }
    
    console.error('Error fetching transaction status:', error);
    return {
      status: 'not_found',
      txHash,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Poll for transaction status until success, failed, or timeout
 */
export const pollTransactionStatus = async (
  txHash: string,
  rpcUrl: string = 'https://soroban-testnet.stellar.org',
  options?: {
    intervalMs?: number;
    maxAttempts?: number;
    onStatusChange?: (status: TransactionInfo) => void;
  }
): Promise<TransactionInfo> => {
  const {
    intervalMs = 2000, // Check every 2 seconds
    maxAttempts = 30,  // Max 30 attempts (60 seconds total)
    onStatusChange,
  } = options || {};

  let attempts = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      attempts += 1;
      
      try {
        const status = await getTransactionStatus(txHash, rpcUrl);
        
        // Notify callback if provided
        if (onStatusChange) {
          onStatusChange(status);
        }
        
        // If transaction is confirmed or failed, stop polling
        if (status.status === 'success' || status.status === 'failed') {
          resolve(status);
          return;
        }
        
        // If max attempts reached, resolve with pending
        if (attempts >= maxAttempts) {
          resolve({
            status: 'pending',
            txHash,
            error: 'Transaction confirmation timeout. Check explorer for status.',
          });
          return;
        }
        
        // Continue polling
        setTimeout(poll, intervalMs);
      } catch (error) {
        console.error('Polling error:', error);
        
        // If max attempts reached, reject
        if (attempts >= maxAttempts) {
          reject(error);
          return;
        }
        
        // Continue polling on error
        setTimeout(poll, intervalMs);
      }
    };

    // Start polling
    poll();
  });
};

/**
 * Format transaction status for display
 */
export const formatTransactionStatus = (status: TransactionStatus): string => {
  switch (status) {
    case 'pending':
      return '⏳ Pending Confirmation...';
    case 'success':
      return '✅ Confirmed';
    case 'failed':
      return '❌ Failed';
    case 'not_found':
      return '❓ Not Found';
    default:
      return 'Unknown';
  }
};

/**
 * Get status color for UI
 */
export const getStatusColor = (status: TransactionStatus): string => {
  switch (status) {
    case 'pending':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'success':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'failed':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'not_found':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};
