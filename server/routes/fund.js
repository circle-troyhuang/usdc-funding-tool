const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { validateAddress } = require('../config/chains');

const router = express.Router();

const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT, 10) || 30000;
const TRANSACTION_LIMIT = parseInt(process.env.TRANSACTION_LIMIT, 10) || 10000;

function validateAmount(amount) {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= TRANSACTION_LIMIT;
}

router.post('/', async (req, res) => {
  try {
    const { amount, address, apiKey, chain = 'ETH', dailySpent = 0 } = req.body;

    // Use server-side API key if configured, otherwise require from client
    const effectiveApiKey = process.env.CIRCLE_API_KEY || apiKey;

    if (!amount || !address) {
      return res.status(400).json({ error: 'Amount and address are required' });
    }
    if (!effectiveApiKey) {
      return res.status(400).json({ error: 'Circle API key is required' });
    }
    if (!validateAmount(amount)) {
      return res.status(400).json({ error: `Amount must be between 0 and ${TRANSACTION_LIMIT.toLocaleString()} USDC` });
    }

    // Validate address format for the selected chain
    const addrResult = validateAddress(chain, address);
    if (!addrResult.valid) {
      return res.status(400).json({ error: addrResult.error });
    }

    // Check daily limit
    const numAmount = parseFloat(amount);
    const currentTotal = parseFloat(dailySpent) || 0;
    if (currentTotal + numAmount > DAILY_LIMIT) {
      return res.status(400).json({
        error: `Daily limit of ${DAILY_LIMIT.toLocaleString()} USDC exceeded. Current 24-hour total: ${currentTotal.toFixed(2)} USDC`,
      });
    }

    const idempotencyKey = uuidv4();
    const apiUrl = process.env.CIRCLE_API_URL || 'https://api-smokebox.circle.com/v1';
    const walletId = process.env.CIRCLE_WALLET_ID || '1000659044';

    const payload = {
      idempotencyKey,
      source: { type: 'wallet', id: walletId },
      amount: { amount: amount.toString(), currency: 'USD' },
      destination: { type: 'blockchain', address, chain },
    };

    console.log('Creating transfer:', { chain, address: address.slice(0, 10) + '...', amount });

    const response = await axios.post(`${apiUrl}/transfers`, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveApiKey}`,
      },
    });

    const transferId = response.data.data?.id || response.data.id;
    if (!transferId) {
      return res.status(500).json({
        error: 'Failed to obtain transfer ID from Circle API',
      });
    }

    const newDailyTotal = currentTotal + numAmount;

    return res.status(200).json({
      success: true,
      data: { id: transferId, ...(response.data.data || response.data) },
      idempotencyKey,
      dailyLimit: {
        limit: DAILY_LIMIT,
        used: newDailyTotal,
        remaining: DAILY_LIMIT - newDailyTotal,
      },
    });
  } catch (error) {
    console.error('Fund error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to process funding request',
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;
