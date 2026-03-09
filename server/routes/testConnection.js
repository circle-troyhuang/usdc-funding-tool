const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { apiKey } = req.body;
    const effectiveApiKey = process.env.CIRCLE_API_KEY || apiKey;

    if (!effectiveApiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const apiUrl = process.env.CIRCLE_API_URL || 'https://api-smokebox.circle.com/v1';
    const walletId = process.env.CIRCLE_WALLET_ID || '1000659044';

    const response = await axios.get(`${apiUrl}/wallets/${walletId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveApiKey}`,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Successfully connected to Circle API',
      walletData: {
        id: response.data.data?.id || response.data.id,
        type: response.data.data?.type || response.data.type,
        description: response.data.data?.description || response.data.description,
      },
    });
  } catch (error) {
    console.error('Test connection error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to connect to Circle API',
      apiError: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      },
    });
  }
});

module.exports = router;
