import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import '../styles/admin.css';

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const role = userSnap.data().role;
          if (role !== 'admin') {
            alert('Bạn không có quyền Admin! Đang quay lại Dashboard...');
            navigate('/dashboard');
          } else {

            setLoading(false);
          }
        } else {

          console.log("Chưa có dữ liệu Firestore, chuyển hướng sang Setup...");
          navigate('/admin-setup');
        }
      } catch (error) {
        console.error('Lỗi kiểm tra quyền:', error);
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) return <div className="loading">Đang kiểm tra quyền Admin...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>TRANG QUẢN LÍ CỦA ADMIN</h2>
      </div>
      <div className="admin-content">
        <p>Chào mừng Admin!</p>

          <Link to="/admin-setup" className="admin-card setup-card">
            <h3> Cài đặt quyền Admin</h3>
          </Link>
        </div>
      </div>
  );
}