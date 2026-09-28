import { useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useRef } from 'react';
import { ShieldCheck, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Verify = () => {
  const [certificateId, setCertificateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  
  const scannerRef = useRef(null);

  const verifyCertificate = async (certId) => {
    if (!certId) return;
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const res = await fetch(`${API_URL}/api/certificates/${certId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifiedBy: 'Public Verifier' })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }
      
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    verifyCertificate(certificateId);
  };
  
  useEffect(() => {
    let scanner = null;
    
    if (scanning && scannerRef.current) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
      scanner.render(
        (decodedText) => {
          setCertificateId(decodedText);
          verifyCertificate(decodedText);
          scanner.clear();
        },
        (error) => {
          // Ignore scanning errors during detection
        }
      );
    }
    
    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error(e));
      }
    };
  }, [scanning]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
      <div className="text-center mb-4">
        <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto' }} />
        <h1 className="page-title mt-4">Verify Certificate</h1>
        <p className="page-subtitle">Enter a Certificate ID or scan a QR code to verify its authenticity.</p>
      </div>

      <div className="card mb-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input 
            type="text" 
            className="form-input flex-1" 
            placeholder="Enter Certificate ID (e.g., CERT-123456)"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !certificateId}>
            {loading ? 'Verifying...' : <><Search size={18} /> Verify</>}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <span className="text-muted mr-4">OR</span>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={() => setScanning(!scanning)}
          >
            {scanning ? 'Cancel Scanning' : 'Scan QR Code'}
          </button>
        </div>
        
        {scanning && (
          <div className="mt-4 p-4 border rounded" style={{ borderColor: 'var(--border)' }}>
            <div id="reader" ref={scannerRef}></div>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {result && (
        <div className={`card ${result.status === 'VALID' ? 'border-success' : 'border-error'}`} style={{
          borderLeft: `4px solid ${result.status === 'VALID' ? 'var(--success)' : result.status === 'REVOKED' ? 'var(--warning)' : 'var(--error)'}`
        }}>
          <div className="flex items-center gap-2 mb-4">
            {result.status === 'VALID' && <CheckCircle size={28} color="var(--success)" />}
            {result.status === 'REVOKED' && <AlertTriangle size={28} color="var(--warning)" />}
            {result.status === 'INVALID' && <XCircle size={28} color="var(--error)" />}
            
            <h2 style={{fontSize: '1.5rem', fontWeight: '700', color: 
              result.status === 'VALID' ? 'var(--success)' : 
              result.status === 'REVOKED' ? 'var(--warning)' : 'var(--error)'
            }}>
              {result.status === 'VALID' ? 'Certificate Valid' : 
               result.status === 'REVOKED' ? 'Certificate Revoked' : 'Certificate Invalid'}
            </h2>
          </div>
          
          <p className="mb-4 text-muted">{result.message}</p>
          
          {result.certificate && (
            <div className="grid-2 mt-4 pt-4" style={{borderTop: '1px solid var(--border)'}}>
              <div>
                <p className="form-label">Certificate ID</p>
                <p style={{fontFamily: 'monospace', fontWeight: '600'}}>{result.certificate.certificateId}</p>
              </div>
              <div>
                <p className="form-label">Student Name</p>
                <p style={{fontWeight: '600'}}>{result.certificate.studentName}</p>
              </div>
              <div>
                <p className="form-label">Course</p>
                <p style={{fontWeight: '600'}}>{result.certificate.course}</p>
              </div>
              <div>
                <p className="form-label">Institution</p>
                <p style={{fontWeight: '600'}}>{result.certificate.institutionName}</p>
              </div>
              <div>
                <p className="form-label">Issue Date</p>
                <p style={{fontWeight: '600'}}>{result.certificate.issueDate}</p>
              </div>
              <div>
                <p className="form-label">Document Hash</p>
                <p style={{fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all'}}>{result.certificate.documentHash}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Verify;
