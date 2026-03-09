const CHAINS = {
  ETH: {
    name: 'Ethereum (Sepolia)',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
    addressExample: '0x1234...abcd',
    explorerBaseUrl: 'https://sepolia.etherscan.io/tx/',
  },
  SOL: {
    name: 'Solana (Devnet)',
    addressRegex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    addressExample: 'A1b2C3d4...',
    explorerBaseUrl: 'https://explorer.solana.com/tx/',
    explorerSuffix: '?cluster=devnet',
  },
  MATIC: {
    name: 'Polygon (Amoy)',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
    addressExample: '0x1234...abcd',
    explorerBaseUrl: 'https://amoy.polygonscan.com/tx/',
  },
  ARB: {
    name: 'Arbitrum (Sepolia)',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
    addressExample: '0x1234...abcd',
    explorerBaseUrl: 'https://sepolia.arbiscan.io/tx/',
  },
  AVAX: {
    name: 'Avalanche (Fuji)',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
    addressExample: '0x1234...abcd',
    explorerBaseUrl: 'https://testnet.snowtrace.io/tx/',
  },
};

function validateAddress(chain, address) {
  const chainConfig = CHAINS[chain];
  if (!chainConfig) {
    return { valid: false, error: `Unsupported chain: ${chain}` };
  }
  if (!chainConfig.addressRegex.test(address)) {
    return { valid: false, error: `Invalid ${chainConfig.name} address format` };
  }
  return { valid: true };
}

module.exports = { CHAINS, validateAddress };
