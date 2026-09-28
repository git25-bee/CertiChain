import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldAlert, AlertTriangle, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const CertificateDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const res = await fetch(`${API_URL}/api/certificates/${id}`);
        if (!res.ok) throw new Error('Certificate not found');
        const data = await res.json();
        setCert(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [id]);

  const handleRevoke = async () => {
    if (!window.confirm('Are you sure you want to revoke this certificate? This action cannot be undone.')) {
      return;
    }
    
    setRevoking(true);
    try {
      const res = await fetch(`${API_URL}/api/certificates/${id}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revokedBy: user?.email || 'Admin' })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revoke certificate');
      }
      
      // Update local state
      setCert({ ...cert, status: 'REVOKED' });
      alert('Certificate revoked successfully.');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setRevoking(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading certificate details...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!cert) return <div className="alert alert-error">Certificate not found.</div>;

  return (
    <div>
      <div className="mb-4">
        <button className="btn btn-outline" onClick={() => navigate(-1)} style={{padding: '0.5rem 1rem'}}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>
      
      <div className="page-header">
        <h1 className="page-title">Certificate Details</h1>
        <p className="page-subtitle">Detailed view of the certificate and its blockchain record.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 style={{fontSize: '1.25rem', fontWeight: '600'}}>Information</h2>
            <span className={`badge ${cert.status === 'ACTIVE' ? 'badge-success' : 'badge-error'}`} style={{fontSize: '1rem'}}>
              {cert.status}
            </span>
          </div>
          
          <table className="w-full" style={{width: '100%', borderCollapse: 'collapse'}}>
            <tbody>
              <tr>
                <td style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border)', fontWeight: '500', width: '40%'}}>Certificate ID</td>
                <td style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border)', fontFamily: 'monospace'}}>{cert.certificateId}</td>
              </tr>
              <tr>
                <td style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border)', fontWeight: '500'}}>Student Name</td>
                <td style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border)'}}>{cert.studentName}</td>
              </tr>
              <tr>
                <td style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border)', fontWeight: '500'}}>Student ID</td>
                <td style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border)'}}>{cert.studentId}</td>
              </tr>
              <tr>
                <td style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border)', fontWeight: '500'}}>Course</td>
                <td style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border)'}}>{cert.course}</td>
              </tr>
              <tr>
                <td style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border)', fontWeight: '500'}}>Type</td>
                <td style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border)'}}>{cert.certificateType}</td>
              </tr>
              <tr>
                <td style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border)', fontWeight: '500'}}>Institution</td>
                <td style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border)'}}>{cert.institutionName}</td>
              </tr>
              <tr>
                <td style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border)', fontWeight: '500'}}>Issue Date</td>
                <td style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border)'}}>{cert.issueDate}</td>
              </tr>
            </tbody>
          </table>
          
          {cert.status === 'ACTIVE' && (
            <div className="mt-4 pt-4" style={{borderTop: '1px solid var(--border)'}}>
              <button 
                className="btn btn-danger flex items-center justify-center" 
                style={{width: '100%'}} 
                onClick={handleRevoke}
                disabled={revoking}
              >
                <AlertTriangle size={18} /> {revoking ? 'Revoking...' : 'Revoke Certificate'}
              </button>
            </div>
          )}
        </div>
        
        <div>
          <div className="card mb-4 flex flex-col items-center">
            <h2 style={{fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem'}}>Verification QR Code</h2>
            <div className="qr-container mt-0">
              <QRCodeSVG value={cert.certificateId} size={180} level="H" />
            </div>
          </div>
          
          <div className="card">
            <h2 style={{fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <ShieldAlert size={20} /> Blockchain Data
            </h2>
            <div>
              <p style={{fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-muted)'}}>Transaction ID</p>
              <p style={{fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '1rem', background: 'var(--background)', padding: '0.5rem', borderRadius: '4px'}}>{cert.transactionId}</p>
              
              <p style={{fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-muted)'}}>Document Hash (SHA-256)</p>
              <p style={{fontFamily: 'monospace', wordBreak: 'break-all', background: 'var(--background)', padding: '0.5rem', borderRadius: '4px'}}>{cert.documentHash}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDetails;
