import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Layout from '../components/Layout';
import { FiCheckCircle, FiUsers, FiUploadCloud, FiUser, FiSettings, FiMail, FiLock, FiCode } from 'react-icons/fi';
import '../styles/dashboard.css';

const MenuItems = [
  { label: 'Tasks', path: '/tasks', icon: <FiCheckCircle size={40} />, color: '#6366f1', desc: 'Quản lý công việc và tiến độ dự án', id: 'view_tasks' },
  { label: 'Team', path: '/team', icon: <FiCode size={40} />, color: '#8b5cf6', desc: 'Lập trình nhóm và chia sẻ mã nguồn', id: 'view_team' },
  { label: 'Upload', path: '/upload', icon: <FiUploadCloud size={40} />, color: '#ec4899', desc: 'Lưu trữ và chia sẻ tài liệu trực tuyến', id: 'view_uploads' },
  { label: 'Members', path: '/members', icon: <FiUser size={40} />, color: '#14b8a6', desc: 'Danh sách thành viên trong hệ thống', id: 'view_members' },
  { label: 'Admin', path: '/admin', icon: <FiSettings size={40} />, color: '#f59e0b', desc: 'Thiết lập hệ thống và phân quyền', id: 'admin_panel' },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userPerms, setUserPerms] = useState([]);
  const [userRole, setUserRole] = useState('member');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate('/login');
      } else {
        setUser(currentUser);
        // ⚡ LẮNG NGHE QUYỀN REALTIME - GIỮ NGUYÊN UI
        const unsub = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
          if (snap.exists()) {
            setUserPerms(snap.data().permissions || []);
            setUserRole(snap.data().role || 'member');
          }
        });
        return () => unsub();
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Bộ lọc Menu dựa trên quyền Admin đã tích
  const visibleMenu = MenuItems.filter(item => {
    if (userRole === 'admin') return true;
    return userPerms.includes(item.id);
  });

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Chào mừng trở lại, {user?.displayName || user?.email?.split('@')[0]}!</h1>
          <p>Hệ thống cộng tác trực tuyến cho đội ngũ dự án của bạn.</p>
        </div>

        <div className="dashboard-grid">
          {visibleMenu.map((item) => (
            <div 
              key={item.path} 
              className="dashboard-card" 
              onClick={() => navigate(item.path)}
              style={{ '--accent-color': item.color }}
            >
              <div className="card-icon" style={{ color: item.color }}>{item.icon}</div>
              <div className="card-content">
                <h3>{item.label}</h3>
                <p>{item.desc}</p>
              </div>
              <div className="card-footer"><span>Truy cập ngay</span><div className="arrow">→</div></div>
            </div>
          ))}
        </div>

        <div className="dashboard-info-section">
          <div className="info-card">
            <FiMail size={24} />
            <div className="info-text"><h4>Email tài khoản</h4><p>{user?.email}</p></div>
          </div>
          <div className="info-card">
            <FiLock size={24} />
            <div className="info-text"><h4>Quyền hạn</h4><p>{userRole.toUpperCase()}</p></div>
          </div>
        </div>
      </div>
    </Layout>
  );
}