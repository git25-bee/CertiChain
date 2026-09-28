import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const IssueCertificate = ({ user }) => {
  const [formData, setFormData] = useState({
    certificateId: `CERT-${Math.floor(Math.random() * 1000000)}`,
    studentName: '',
    studentId: '',
    course: '',
    certificateType: 'Degree',
    institutionName: 'Example University',
    issueDate: new Date().toISOString().split('T')[0]
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          issuedBy: user?.email || 'admin'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to issue certificate');
      }
      
      setResult(data.certificate);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setFormData({
      ...formData,
      certificateId: `CERT-${Math.floor(Math.random() * 1000000)}`,
      studentName: '',
      studentId: ''
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Issue Certificate</h1>
        <p className="page-subtitle">Register a new academic certificate on the blockchain-style ledger.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {result && <div className="alert alert-success">Certificate issued successfully!</div>}

      <div className="grid-2">
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Certificate ID</label>
                <input type="text" name="certificateId" className="form-input" value={formData.certificateId} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Student ID</label>
                <input type="text" name="studentId" className="form-input" value={formData.studentId} onChange={handleChange} required />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Student Name</label>
              <input type="text" name="studentName" className="form-input" value={formData.studentName} onChange={handleChange} required />
            </div>
            
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Course / Degree</label>
                <input type="text" name="course" className="form-input" value={formData.course} onChange={handleChange} placeholder="B.E. Computer Science" required />
              </div>
              <div className="form-group">
                <label className="form-label">Certificate Type</label>
                <select name="certificateType" className="form-select" value={formData.certificateType} onChange={handleChange}>
                  <option value="Degree">Degree</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Transcript">Transcript</option>
                </select>
              </div>
            </div>
            
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Institution Name</label>
                <input type="text" name="institutionName" className="form-input" value={formData.institutionName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Issue Date</label>
                <input type="date" name="issueDate" className="form-input" value={formData.issueDate} onChange={handleChange} required />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={loading || result}>
              {loading ? 'Issuing...' : 'Issue Certificate'}
            </button>
            {result && (
              <button type="button" className="btn btn-outline" onClick={resetForm} style={{marginLeft: '1rem'}}>
                Issue Another
              </button>
            )}
          </form>
        </div>

        {result && (
          <div className="card flex flex-col items-center">
            <h3 style={{fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem'}}>Certificate Generated</h3>
            <div className="qr-container mt-0 w-full">
              <QRCodeSVG value={result.certificateId} size={200} level="H" />
              <p className="mt-4 text-center text-muted" style={{fontSize: '0.875rem'}}>
                Scan this QR code to verify the certificate or use the Certificate ID: <br/>
                <strong>{result.certificateId}</strong>
              </p>
            </div>
            <div className="mt-4 w-full" style={{fontSize: '0.875rem'}}>
               <p><strong>Transaction ID:</strong> <span style={{fontFamily: 'monospace'}}>{result.transactionId}</span></p>
               <p><strong>Document Hash:</strong> <span style={{fontFamily: 'monospace', wordBreak: 'break-all'}}>{result.documentHash}</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueCertificate;
