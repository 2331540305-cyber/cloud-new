import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useEffect, useState } from 'react';
import '../styles/layout.css';

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Tasks', path: '/tasks' },
    { label: 'Team', path: '/team' },
    { label: 'Upload', path: '/upload' },
    { label: 'Members', path: '/members' },
    { label: 'Admin', path: '/admin' },
  ];

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <span className="logo">☁️ CoWorking Cloud</span>
          </div>
          
          <button 
            className="mobile-menu-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            ☰
          </button>

          <div className={`navbar-menu ${showMenu ? 'active' : ''}`}>
            {menuItems.map(item => (
              <a 
                key={item.path}
                href={item.path}
                className="nav-link"
                onClick={() => setShowMenu(false)}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="navbar-user">
            {user && (
              <>
                <span className="user-email">{user.email}</span>
                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
