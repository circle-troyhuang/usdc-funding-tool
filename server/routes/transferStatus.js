const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/:transferId', async (req, res) => {
  try {
    const { transferId } = req.params;
    const { apiKey } = req.query;

    const effectiveApiKey = process.env.CIRCLE_API_KEY || apiKey;

    if (!transferId) {
      return res.status(400).json({ error: 'Transfer ID is required' });
    }
    if (!effectiveApiKey) {
      return res.status(400).json({ error: 'Circle API key is required' });
    }

    const apiUrl = process.env.CIRCLE_API_URL || 'https://api-smokebox.circle.com/v1';

    const response = await axios.get(`${apiUrl}/transfers/${transferId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveApiKey}`,
      },
    });

    return res.status(200).json({
      success: true,
      data: response.data.data || response.data,
    });
  } catch (error) {
    console.error('Transfer status error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch transfer status',
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;
