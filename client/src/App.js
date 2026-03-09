import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import axios from 'axios';
import TransactionStatus from './components/TransactionStatus';
import ApiDiagnostic from './components/ApiDiagnostic';
import ChainSelector from './components/ChainSelector';
import CHAINS, { validateAddress } from './config/chains';

const DAILY_LIMIT = 30000;
const API_KEY_EXPIRY_MINUTES = 5;

function App() {
  const [formData, setFormData] = useState({
    address: '',
    amount: '',
    apiKey: '',
    chain: 'ETH',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [apiKeyTimer, setApiKeyTimer] = useState(null);
  const [dailyUsage, setDailyUsage] = useState({ used: 0, remaining: DAILY_LIMIT });
  const [apiKeyRequired, setApiKeyRequired] = useState(true);

  const [showTransactionStatus, setShowTransactionStatus] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // Fetch config to determine if API key input is needed
  useEffect(() => {
    axios
      .get('/api/config')
      .then((res) => setApiKeyRequired(res.data.apiKeyRequired))
      .catch(() => setApiKeyRequired(true));
  }, []);

  const resetDailyUsage = useCallback(() => {
    const newData = {
      used: 0,
      remaining: DAILY_LIMIT,
      date: new Date().toISOString(),
    };
    localStorage.setItem('fundingToolDailyUsage', JSON.stringify(newData));
    setDailyUsage({ used: 0, remaining: DAILY_LIMIT });
  }, []);

  const loadDailyUsage = useCallback(() => {
    try {
      const storedData = localStorage.getItem('fundingToolDailyUsage');
      if (storedData) {
        const data = JSON.parse(storedData);
        const storedDate = new Date(data.date);
        const today = new Date();
        if (storedDate.toDateString() === today.toDateString()) {
          setDailyUsage({ used: data.used, remaining: DAILY_LIMIT - data.used });
        } else {
          resetDailyUsage();
        }
      } else {
        resetDailyUsage();
      }
    } catch {
      resetDailyUsage();
    }
  }, [resetDailyUsage]);

  useEffect(() => {
    loadDailyUsage();
  }, [loadDailyUsage]);

  const updateDailyUsage = useCallback((amount) => {
    const numAmount = parseFloat(amount);
    setDailyUsage((prev) => {
      const newUsed = prev.used + numAmount;
      const newRemaining = DAILY_LIMIT - newUsed;
      localStorage.setItem(
        'fundingToolDailyUsage',
        JSON.stringify({ used: newUsed, remaining: newRemaining, date: new Date().toISOString() })
      );
      return { used: newUsed, remaining: newRemaining };
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'apiKey' && value) {
      resetApiKeyTimer();
    }

    // Clear address when chain changes (different format)
    if (name === 'chain') {
      setFormData((prev) => ({ ...prev, chain: value, address: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    setError('');
    setSuccess(null);
  };

  const resetApiKeyTimer = () => {
    if (apiKeyTimer) clearTimeout(apiKeyTimer);
    const timer = setTimeout(() => {
      setFormData((prev) => ({ ...prev, apiKey: '' }));
      setApiKeyTimer(null);
    }, API_KEY_EXPIRY_MINUTES * 60 * 1000);
    setApiKeyTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (apiKeyTimer) clearTimeout(apiKeyTimer);
    };
  }, [apiKeyTimer]);

  const handleBackToForm = () => {
    setShowTransactionStatus(false);
    setTransactionId('');
    setSuccess(null);
  };

  const handleViewTransaction = (id) => {
    setTransactionId(id);
    setShowTransactionStatus(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.address || !formData.amount) {
      setError('Address and amount are required');
      return;
    }
    if (apiKeyRequired && !formData.apiKey) {
      setError('Circle API key is required');
      return;
    }

    if (!validateAddress(formData.chain, formData.address)) {
      const chainName = CHAINS[formData.chain]?.name || formData.chain;
      setError(`Invalid ${chainName} address format`);
      return;
    }

    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0 || numAmount > 10000) {
      setError('Amount must be between 0 and 10,000 USDC');
      return;
    }
    if (numAmount + dailyUsage.used > DAILY_LIMIT) {
      setError(
        `Daily limit of ${DAILY_LIMIT.toLocaleString()} USDC exceeded. Current 24-hour total: ${dailyUsage.used.toFixed(2)} USDC`
      );
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess(null);

      const response = await axios.post('/api/fund', {
        address: formData.address,
        amount: formData.amount,
        apiKey: formData.apiKey || undefined,
        chain: formData.chain,
        dailySpent: dailyUsage.used,
      });

      updateDailyUsage(formData.amount);

      const txId = response.data.data?.id;
      if (!txId) throw new Error('No transaction ID was returned from the API');

      setTransactionId(txId);
      setShowTransactionStatus(true);
      setFormData((prev) => ({ ...prev, address: '', amount: '' }));
      if (apiKeyRequired) resetApiKeyTimer();
    } catch (error) {
      let errorMessage = 'Failed to process funding request';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage =
          typeof error.response.data.details === 'string'
            ? error.response.data.details
            : JSON.stringify(error.response.data.details);
      } else if (error.message) {
        errorMessage = error.message;
      }
      if (error.response?.status === 403) {
        errorMessage += ' - API key may be invalid or have insufficient permissions. Status: 403 Forbidden';
      }
      setError(errorMessage);
      setShowTransactionStatus(false);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    parseFloat(value).toLocaleString('en-US', {
      style: 'decimal',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });

  const currentChain = CHAINS[formData.chain];

  return (
    <div className="App">
      <header className="App-header">
        <h1>Testnet USDC Funding Tool</h1>
      </header>
      <main className="container">
        <div className="card">
          {!showTransactionStatus ? (
            <>
              <h2>Fund Blockchain Address</h2>

              <div className="daily-limit-info">
                <div className="limit-bar">
                  <div
                    className="limit-bar-progress"
                    style={{ width: `${Math.min(100, (dailyUsage.used / DAILY_LIMIT) * 100)}%` }}
                  ></div>
                </div>
                <div className="limit-details">
                  <span>
                    Daily Limit: <strong>{formatCurrency(DAILY_LIMIT)} USDC</strong>
                  </span>
                  <span>
                    Used: <strong>{formatCurrency(dailyUsage.used)} USDC</strong>
                  </span>
                  <span>
                    Remaining: <strong>{formatCurrency(dailyUsage.remaining)} USDC</strong>
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {apiKeyRequired && (
                  <div className="form-group">
                    <label htmlFor="apiKey">Circle API Key</label>
                    <input
                      type="password"
                      id="apiKey"
                      name="apiKey"
                      value={formData.apiKey}
                      onChange={handleChange}
                      placeholder="Enter Circle API Key"
                      className="form-control"
                      autoComplete="off"
                    />
                    <small>Your API key is only sent to the Circle API and not stored on our servers</small>
                  </div>
                )}

                <ChainSelector value={formData.chain} onChange={handleChange} />

                <div className="form-group">
                  <label htmlFor="address">{currentChain?.name || formData.chain} Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={currentChain?.placeholder || '0x...'}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="amount">Amount (USDC)</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="Enter amount (max 10,000 USDC)"
                    className="form-control"
                    step="0.01"
                    min="0.01"
                    max="10000"
                  />
                  <small>Max per transaction: 10,000 USDC / Daily limit: {formatCurrency(DAILY_LIMIT)} USDC</small>
                </div>

                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Processing...' : 'Fund Address'}
                </button>
              </form>

              {error && (
                <div className="error-message">
                  <p>{error}</p>
                  {error.includes('403') && apiKeyRequired && <ApiDiagnostic apiKey={formData.apiKey} />}
                </div>
              )}

              {success && (
                <div className="success-message">
                  <p>{success.message}</p>
                  <div className="transaction-details">
                    <p>
                      <strong>Transaction ID:</strong> {success.transactionId}
                    </p>
                    <p>
                      <strong>Idempotency Key:</strong> {success.idempotencyKey}
                    </p>
                    <button className="view-details-button" onClick={() => handleViewTransaction(success.transactionId)}>
                      View Transaction Details
                    </button>
                  </div>
                </div>
              )}

              {apiKeyRequired && formData.apiKey && !error && !success && (
                <div className="diagnostic-section">
                  <ApiDiagnostic apiKey={formData.apiKey} />
                </div>
              )}
            </>
          ) : (
            <TransactionStatus
              transferId={transactionId}
              apiKey={formData.apiKey}
              chain={formData.chain}
              onBack={handleBackToForm}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
