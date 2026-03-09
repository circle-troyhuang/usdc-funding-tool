import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getExplorerLink } from '../config/chains';
import CHAINS from '../config/chains';
import './TransactionStatus.css';

const TransactionStatus = ({ transferId, apiKey, chain, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactionStatus = useCallback(async () => {
    try {
      setRefreshing(true);

      if (!transferId) {
        setError('Transfer ID is missing. Please go back and try again.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const params = apiKey ? `?apiKey=${encodeURIComponent(apiKey)}` : '';
      const response = await axios.get(`/api/transfer-status/${transferId}${params}`);
      setTransaction(response.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching transaction status:', err);
      setError('Failed to fetch transaction status. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [transferId, apiKey]);

  useEffect(() => {
    fetchTransactionStatus();

    const intervalId = setInterval(() => {
      if (transaction?.status === 'pending') {
        fetchTransactionStatus();
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [transferId, apiKey, transaction?.status, fetchTransactionStatus]);

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'complete':
        return 'status-badge status-complete';
      case 'pending':
        return 'status-badge status-pending';
      case 'failed':
        return 'status-badge status-failed';
      default:
        return 'status-badge';
    }
  };

  if (loading && !transaction) {
    return (
      <div className="transaction-status-container">
        <h2>Loading Transaction Details...</h2>
        <div className="transaction-info">
          <p>
            Transfer ID: <strong>{transferId || 'Missing ID'}</strong>
          </p>
        </div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className="transaction-status-container">
        <h2>Error Loading Transaction</h2>
        <div className="transaction-info">
          <p>
            Transfer ID: <strong>{transferId || 'Missing ID'}</strong>
          </p>
        </div>
        <p className="error-message">{error}</p>
        <button className="back-button" onClick={onBack}>
          Back to Form
        </button>
      </div>
    );
  }

  // Determine chain from transaction data or prop
  const txChain = transaction?.destination?.chain || chain || 'ETH';
  const chainConfig = CHAINS[txChain];
  const explorerLink = getExplorerLink(txChain, transaction?.transactionHash);

  return (
    <div className="transaction-status-container">
      <h2>Transaction Details</h2>

      <div className="transaction-header">
        <span className={getStatusBadgeClass(transaction.status)}>{transaction.status.toUpperCase()}</span>
        <button className="refresh-button" onClick={fetchTransactionStatus} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>

      <div className="transaction-details-card">
        <div className="detail-row">
          <span className="detail-label">Transaction ID:</span>
          <span className="detail-value">{transaction.id}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Created:</span>
          <span className="detail-value">{formatDate(transaction.createDate)}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Amount:</span>
          <span className="detail-value">
            {transaction.amount.amount} {transaction.amount.currency}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Recipient:</span>
          <span className="detail-value">{transaction.destination.address}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Network:</span>
          <span className="detail-value">{chainConfig?.name || txChain}</span>
        </div>

        {transaction.transactionHash && explorerLink && (
          <div className="detail-row">
            <span className="detail-label">Transaction Hash:</span>
            <span className="detail-value hash-value">
              <a href={explorerLink} target="_blank" rel="noopener noreferrer" className="explorer-link">
                {transaction.transactionHash}
                <svg
                  className="external-link-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </span>
          </div>
        )}
      </div>

      {transaction.status === 'pending' && (
        <div className="pending-message">
          <p>Transaction is still processing. This page will automatically refresh when the status changes.</p>
        </div>
      )}

      <button className="back-button" onClick={onBack}>
        Back to Form
      </button>
    </div>
  );
};

export default TransactionStatus;
