import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IssueCertificate from './pages/IssueCertificate';
import MyCertificates from './pages/MyCertificates';
import CertificateDetails from './pages/CertificateDetails';
import Verify from './pages/Verify';
import Transactions from './pages/Transactions';

function App() {
  const [user, setUser] = useState({ email: 'demo-user@university.edu', uid: 'demo-123' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth || !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.includes('dummy')) {
      return;
    }
    
    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return unsubscribe;
    } catch (e) {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="app-container"><div className="main-content">Loading...</div></div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        
        {/* Public Route */}
        <Route path="/verify" element={<Layout><Verify /></Layout>} />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute user={user}><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="issue-certificate" element={<IssueCertificate user={user} />} />
          <Route path="certificates" element={<MyCertificates />} />
          <Route path="certificates/:id" element={<CertificateDetails user={user} />} />
          <Route path="transactions" element={<Transactions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
