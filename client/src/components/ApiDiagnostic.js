import React, { useState } from 'react';
import axios from 'axios';

const ApiDiagnostic = ({ apiKey }) => {
  const [diagStatus, setDiagStatus] = useState('idle');
  const [diagResult, setDiagResult] = useState(null);
  const [diagError, setDiagError] = useState(null);

  const runDiagnostic = async () => {
    if (!apiKey) {
      setDiagError('API key is required for diagnostic test');
      return;
    }

    setDiagStatus('running');
    setDiagResult(null);
    setDiagError(null);

    try {
      // Test direct connection
      const testData = {
        testMode: true,
        timestamp: new Date().toISOString(),
        apiKeyLength: apiKey ? apiKey.length : 0
      };

      const response = await axios.post('/api/test-connection', {
        apiKey,
        testData
      });

      setDiagResult({
        success: true,
        data: response.data
      });
    } catch (error) {
      console.error('Diagnostic error:', error);
      setDiagError({
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    } finally {
      setDiagStatus('complete');
    }
  };

  return (
    <div className="api-diagnostic">
      <h4>API Connectivity Diagnostic</h4>
      
      <button 
        onClick={runDiagnostic} 
        disabled={diagStatus === 'running' || !apiKey}
        className="diagnostic-button"
      >
        {diagStatus === 'running' ? 'Running Test...' : 'Test API Connection'}
      </button>
      
      {diagStatus === 'complete' && diagResult && (
        <div className="diagnostic-result success">
          <p>✅ API connection successful</p>
          <pre>{JSON.stringify(diagResult.data, null, 2)}</pre>
        </div>
      )}
      
      {diagStatus === 'complete' && diagError && (
        <div className="diagnostic-result error">
          <p>❌ API connection failed</p>
          <p>Error: {diagError.message}</p>
          {diagError.status && <p>Status: {diagError.status}</p>}
          {diagError.data && (
            <pre>{JSON.stringify(diagError.data, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiDiagnostic; 