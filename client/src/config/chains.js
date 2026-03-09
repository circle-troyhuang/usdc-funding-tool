const CHAINS = {
  ETH: {
    name: 'Ethereum (Sepolia)',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
    placeholder: '0x...',
    explorerBaseUrl: 'https://sepolia.etherscan.io/tx/',
    explorerSuffix: '',
  },
  SOL: {
    name: 'Solana (Devnet)',
    addressRegex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    placeholder: 'Base58 address...',
    explorerBaseUrl: 'https://explorer.solana.com/tx/',
    explorerSuffix: '?cluster=devnet',
  },
  MATIC: {
    name: 'Polygon (Amoy)',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
    placeholder: '0x...',
    explorerBaseUrl: 'https://amoy.polygonscan.com/tx/',
    explorerSuffix: '',
  },
  ARB: {
    name: 'Arbitrum (Sepolia)',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
    placeholder: '0x...',
    explorerBaseUrl: 'https://sepolia.arbiscan.io/tx/',
    explorerSuffix: '',
  },
  AVAX: {
    name: 'Avalanche (Fuji)',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
    placeholder: '0x...',
    explorerBaseUrl: 'https://testnet.snowtrace.io/tx/',
    explorerSuffix: '',
  },
};

export function getExplorerLink(chain, txHash) {
  const config = CHAINS[chain];
  if (!config || !txHash) return null;
  return `${config.explorerBaseUrl}${txHash}${config.explorerSuffix}`;
}

export function validateAddress(chain, address) {
  const config = CHAINS[chain];
  if (!config) return false;
  return config.addressRegex.test(address);
}

export default CHAINS;
