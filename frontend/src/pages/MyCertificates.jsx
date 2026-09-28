import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const MyCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await fetch(`${API_URL}/api/certificates`);
        if (!res.ok) throw new Error('Failed to fetch certificates');
        const data = await res.json();
        setCertificates(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Certificates</h1>
        <p className="page-subtitle">List of all issued certificates.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="text-center p-4">Loading certificates...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Student Name</th>
                  <th>Course</th>
                  <th>Institution</th>
                  <th>Issue Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {certificates.length === 0 ? (
                  <tr><td colSpan="7" className="text-center">No certificates found.</td></tr>
                ) : (
                  certificates.map(cert => (
                    <tr key={cert.certificateId}>
                      <td style={{fontFamily: 'monospace'}}>{cert.certificateId}</td>
                      <td>{cert.studentName}</td>
                      <td>{cert.course}</td>
                      <td>{cert.institutionName}</td>
                      <td>{cert.issueDate}</td>
                      <td>
                        <span className={`badge ${cert.status === 'ACTIVE' ? 'badge-success' : 'badge-error'}`}>
                          {cert.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/certificates/${cert.certificateId}`} className="btn btn-outline" style={{padding: '0.25rem 0.5rem', fontSize: '0.875rem'}}>
                          <Eye size={14} /> View
                        </Link>
                      </td>
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

export default MyCertificates;
