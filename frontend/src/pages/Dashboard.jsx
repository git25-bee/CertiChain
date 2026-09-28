import { useState, useEffect } from 'react';
import { Activity, Award, XCircle, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, revoked: 0 });
  const [recentTxns, setRecentTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [certRes, txnRes] = await Promise.all([
          fetch(`${API_URL}/api/certificates?limit=1000`),
          fetch(`${API_URL}/api/transactions?limit=5`)
        ]);
        
        const certs = await certRes.json();
        const txns = await txnRes.json();
        
        if (Array.isArray(certs)) {
          const active = certs.filter(c => c.status === 'ACTIVE').length;
          const revoked = certs.filter(c => c.status === 'REVOKED').length;
          setStats({ total: certs.length, active, revoked });
        }
        
        if (Array.isArray(txns)) {
          setRecentTxns(txns);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of system activity and certificates.</p>
      </div>

      <div className="grid-4 mb-4">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Award size={20} color="var(--primary)" />
            <span className="stat-label">Total Issued</span>
          </div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} color="var(--success)" />
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-value" style={{color: 'var(--success)'}}>{stats.active}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <XCircle size={20} color="var(--error)" />
            <span className="stat-label">Revoked</span>
          </div>
          <div className="stat-value" style={{color: 'var(--error)'}}>{stats.revoked}</div>
        </div>
        <div className="stat-card flex items-center justify-center">
           <Link to="/issue-certificate" className="btn btn-primary">
             Issue New Certificate
           </Link>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} /> Recent Transactions
        </h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Action</th>
                <th>Certificate ID</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTxns.length === 0 ? (
                <tr><td colSpan="4" className="text-center">No recent transactions</td></tr>
              ) : (
                recentTxns.map(txn => (
                  <tr key={txn.transactionId}>
                    <td style={{fontFamily: 'monospace', fontSize: '0.875rem'}}>{txn.transactionId}</td>
                    <td>
                      <span className={`badge ${txn.action === 'ISSUED' ? 'badge-success' : txn.action === 'REVOKED' ? 'badge-error' : 'badge-info'}`}>
                        {txn.action}
                      </span>
                    </td>
                    <td>{txn.certificateId}</td>
                    <td>{new Date(txn.timestamp).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-center">
           <Link to="/transactions" className="btn btn-outline">View All Transactions</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
