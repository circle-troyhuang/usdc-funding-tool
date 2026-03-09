import React from 'react';
import CHAINS from '../config/chains';

const ChainSelector = ({ value, onChange }) => {
  return (
    <div className="form-group">
      <label htmlFor="chain">Blockchain Network</label>
      <select
        id="chain"
        name="chain"
        value={value}
        onChange={onChange}
        className="form-control"
      >
        {Object.entries(CHAINS).map(([key, config]) => (
          <option key={key} value={key}>
            {config.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ChainSelector;
