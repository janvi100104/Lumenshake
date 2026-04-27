/**
 * Blockchain Explorer Utilities
 * Generate explorer links for Stellar transactions, accounts, and contracts
 */

const STELLAR_EXPLORERS = {
  testnet: {
    base: 'https://stellar.expert/explorer/testnet',
    tx: (hash) => `https://stellar.expert/explorer/testnet/tx/${hash}`,
    account: (address) => `https://stellar.expert/explorer/testnet/account/${address}`,
    contract: (address) => `https://stellar.expert/explorer/testnet/contract/${address}`,
    operation: (id) => `https://stellar.expert/explorer/testnet/tx/${id}`,
  },
  mainnet: {
    base: 'https://stellar.expert/explorer/public',
    tx: (hash) => `https://stellar.expert/explorer/public/tx/${hash}`,
    account: (address) => `https://stellar.expert/explorer/public/account/${address}`,
    contract: (address) => `https://stellar.expert/explorer/public/contract/${address}`,
    operation: (id) => `https://stellar.expert/explorer/public/tx/${id}`,
  },
  // Alternative explorers
  stellarExpert: {
    testnet: 'https://stellar.expert/explorer/testnet',
    mainnet: 'https://stellar.expert/explorer/public',
  },
  stellarChain: {
    testnet: 'https://testnet.stellarchain.io',
    mainnet: 'https://stellarchain.io',
  },
};

/**
 * Get the current network mode
 * @returns {string} 'testnet' or 'mainnet'
 */
function getNetwork() {
  return process.env.NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
}

/**
 * Generate transaction explorer link
 * @param {string} txHash - Transaction hash
 * @param {string} network - Optional network override
 * @returns {string} Explorer URL
 */
function getTransactionLink(txHash, network = null) {
  if (!txHash) return null;
  const net = network || getNetwork();
  return STELLAR_EXPLORERS[net].tx(txHash);
}

/**
 * Generate account explorer link
 * @param {string} address - Stellar account address
 * @param {string} network - Optional network override
 * @returns {string} Explorer URL
 */
function getAccountLink(address, network = null) {
  if (!address) return null;
  const net = network || getNetwork();
  return STELLAR_EXPLORERS[net].account(address);
}

/**
 * Generate contract explorer link
 * @param {string} contractId - Contract address
 * @param {string} network - Optional network override
 * @returns {string} Explorer URL
 */
function getContractLink(contractId, network = null) {
  if (!contractId) return null;
  const net = network || getNetwork();
  return STELLAR_EXPLORERS[net].contract(contractId);
}

/**
 * Generate MoneyGram tracking link (if available)
 * @param {string} trackingNumber - MoneyGram tracking number
 * @returns {string} Tracking URL
 */
function getMoneyGramTrackingLink(trackingNumber) {
  if (!trackingNumber) return null;
  return `https://www.moneygram.com/track?trackingNumber=${trackingNumber}`;
}

/**
 * Add explorer links to transaction object
 * @param {object} transaction - Transaction object
 * @returns {object} Transaction with explorer links
 */
function addExplorerLinks(transaction) {
  const links = {};

  if (transaction.stellar_transaction_id || transaction.stellarTransactionId) {
    const txHash = transaction.stellar_transaction_id || transaction.stellarTransactionId;
    links.transaction = getTransactionLink(txHash);
  }

  if (transaction.sender_stellar_account || transaction.senderStellarAccount) {
    const sender = transaction.sender_stellar_account || transaction.senderStellarAccount;
    links.sender = getAccountLink(sender);
  }

  if (transaction.receiver_stellar_account || transaction.receiverStellarAccount) {
    const receiver = transaction.receiver_stellar_account || transaction.receiverStellarAccount;
    links.receiver = getAccountLink(receiver);
  }

  if (transaction.contract_id || transaction.contractId) {
    const contract = transaction.contract_id || transaction.contractId;
    links.contract = getContractLink(contract);
  }

  if (transaction.tracking_number || transaction.trackingNumber) {
    const tracking = transaction.tracking_number || transaction.trackingNumber;
    links.moneygram = getMoneyGramTrackingLink(tracking);
  }

  return {
    ...transaction,
    explorer_links: links,
  };
}

/**
 * Add explorer links to array of transactions
 * @param {array} transactions - Array of transaction objects
 * @returns {array} Transactions with explorer links
 */
function addExplorerLinksToArray(transactions) {
  if (!Array.isArray(transactions)) return [];
  return transactions.map(addExplorerLinks);
}

module.exports = {
  getTransactionLink,
  getAccountLink,
  getContractLink,
  getMoneyGramTrackingLink,
  addExplorerLinks,
  addExplorerLinksToArray,
  getNetwork,
  STELLAR_EXPLORERS,
};
