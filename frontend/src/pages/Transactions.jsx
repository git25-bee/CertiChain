import { useState, useEffect } from 'react';
import { Activity, ShieldAlert } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${API_URL}/api/transactions?limit=100`);
        if (!res.ok) throw new Error('Failed to fetch transactions');
        const data = await res.json();
        setTransactions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><Activity /> Transaction History</h1>
        <p className="page-subtitle">Immutable blockchain-style record of all certificate activities.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 text-blue-800 rounded" style={{backgroundColor: '#eff6ff', color: '#1e40af', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem'}}>
          <ShieldAlert size={18} />
          <span>This ledger ensures that every certificate issuance, verification, and revocation is securely hashed and recorded.</span>
        </div>

        {loading ? (
          <div className="text-center p-4">Loading transactions...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Transaction ID / Hash</th>
                  <th>Action</th>
                  <th>Certificate ID</th>
                  <th>Date & Time</th>
                  <th>Performed By</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan="5" className="text-center">No transactions found.</td></tr>
                ) : (
                  transactions.map(txn => (
                    <tr key={txn.transactionId}>
                      <td>
                        <div style={{fontFamily: 'monospace', fontWeight: '600'}}>{txn.transactionId}</div>
                        <div style={{fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px'}} title={`Prev: ${txn.previousHash}\nCurr: ${txn.currentHash}`}>
                          Hash: {txn.currentHash.substring(0, 16)}...
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${txn.action === 'ISSUED' ? 'badge-success' : txn.action === 'REVOKED' ? 'badge-error' : 'badge-info'}`}>
                          {txn.action}
                        </span>
                      </td>
                      <td style={{fontFamily: 'monospace'}}>{txn.certificateId}</td>
                      <td>{new Date(txn.timestamp).toLocaleString()}</td>
                      <td>{txn.performedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
