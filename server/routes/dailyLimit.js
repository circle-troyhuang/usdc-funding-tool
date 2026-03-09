const express = require('express');

const router = express.Router();

const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT, 10) || 30000;

// In-memory transaction tracking (resets on server restart)
const dailyTransactions = [];

function getDailyTotal() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  // Remove old transactions
  while (dailyTransactions.length > 0 && dailyTransactions[0].timestamp < oneDayAgo) {
    dailyTransactions.shift();
  }
  return dailyTransactions.reduce((total, tx) => total + tx.amount, 0);
}

router.get('/', (req, res) => {
  const currentTotal = getDailyTotal();
  return res.status(200).json({
    dailyLimit: DAILY_LIMIT,
    used: currentTotal,
    remaining: DAILY_LIMIT - currentTotal,
    transactions: dailyTransactions,
  });
});

module.exports = router;
