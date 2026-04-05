import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import '../styles/auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate('/dashboard');
    });
    return () => unsubscribe();
  }, [navigate]);

  // ⚡ HÀM ĐỒNG BỘ USER VÀO DATABASE
  const syncUserToFirestore = async (user) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Nếu là User mới hoàn toàn
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || email.split('@')[0],
          photoURL: user.photoURL || '',
          role: "member", // Mặc định
          permissions: ["view_tasks", "view_uploads"], // Quyền cơ bản ban đầu
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
      } else {
        // Nếu User cũ quay lại, cập nhật ngày đăng nhập cuối
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
      }
    } catch (err) {
      console.error("Lỗi đồng bộ User:", err);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await syncUserToFirestore(result.user);
      navigate('/dashboard');
    } catch (err) {
      setError("Email hoặc mật khẩu không chính xác!");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserToFirestore(result.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Đăng nhập Hệ thống</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleEmailLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
        
        <div className="divider">HOẶC</div>
        
        <button className="google-login-btn" onClick={handleGoogleLogin} disabled={loading}>
           Tiếp tục với Google
        </button>
        
        <div className="auth-footer">
          <p>Chưa có tài khoản? <a href="/register">Đăng ký ngay</a></p>
        </div>
      </div>
    </div>
  );
}