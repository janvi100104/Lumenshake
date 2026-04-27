/**
 * Blockchain Explorer Link Utilities for Frontend
 * Generate explorer links for Stellar transactions and accounts
 */

// Explorer configuration
const EXPLORER_CONFIG = {
  testnet: {
    base: 'https://stellar.expert/explorer/testnet',
    tx: (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`,
    account: (address: string) => `https://stellar.expert/explorer/testnet/account/${address}`,
    contract: (address: string) => `https://stellar.expert/explorer/testnet/contract/${address}`,
  },
  mainnet: {
    base: 'https://stellar.expert/explorer/public',
    tx: (hash: string) => `https://stellar.expert/explorer/public/tx/${hash}`,
    account: (address: string) => `https://stellar.expert/explorer/public/account/${address}`,
    contract: (address: string) => `https://stellar.expert/explorer/public/contract/${address}`,
  },
};

// Get network from environment
const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';

/**
 * Get transaction explorer link
 */
export function getTransactionLink(txHash: string | null | undefined): string | null {
  if (!txHash) return null;
  return EXPLORER_CONFIG[NETWORK as keyof typeof EXPLORER_CONFIG].tx(txHash);
}

/**
 * Get account explorer link
 */
export function getAccountLink(address: string | null | undefined): string | null {
  if (!address) return null;
  return EXPLORER_CONFIG[NETWORK as keyof typeof EXPLORER_CONFIG].account(address);
}

/**
 * Get contract explorer link
 */
export function getContractLink(contractId: string | null | undefined): string | null {
  if (!contractId) return null;
  return EXPLORER_CONFIG[NETWORK as keyof typeof EXPLORER_CONFIG].contract(contractId);
}

/**
 * Get MoneyGram tracking link
 */
export function getMoneyGramTrackingLink(trackingNumber: string | null | undefined): string | null {
  if (!trackingNumber) return null;
  return `https://www.moneygram.com/track?trackingNumber=${trackingNumber}`;
}

/**
 * Explorer Link Component Props
 */
export interface ExplorerLinkProps {
  href: string | null;
  children: React.ReactNode;
  className?: string;
  label?: string;
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format hash for display
 */
export function shortenHash(hash: string, chars: number = 8): string {
  if (!hash) return '';
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}
