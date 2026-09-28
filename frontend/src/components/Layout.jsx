import { Link, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { LogOut, Award, ShieldCheck, Home, FileText, Activity } from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <Award size={24} />
          CertiChain
        </div>
        <div className="navbar-links">
          {user ? (
            <>
              <Link to="/dashboard" className="navbar-link flex items-center gap-2"><Home size={18} /> Dashboard</Link>
              <Link to="/issue-certificate" className="navbar-link flex items-center gap-2"><Award size={18} /> Issue</Link>
              <Link to="/certificates" className="navbar-link flex items-center gap-2"><FileText size={18} /> Certificates</Link>
              <Link to="/verify" className="navbar-link flex items-center gap-2"><ShieldCheck size={18} /> Verify</Link>
              <Link to="/transactions" className="navbar-link flex items-center gap-2"><Activity size={18} /> History</Link>
              <button onClick={handleLogout} className="btn btn-outline flex items-center gap-2" style={{padding: "0.5rem 1rem"}}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="navbar-link">Login</Link>
          )}
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
