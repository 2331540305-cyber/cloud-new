import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; 
import { auth, db } from '../config/firebase'; 
import Layout from '../components/Layout';
import CollaborativeEditor from '../components/CollaborativeEditor'; 
import { FiEdit3, FiCheckCircle, FiInfo, FiLock } from 'react-icons/fi'; 
import '../styles/tasks.css';

export default function Tasks() {
  const [user, setUser] = useState(null);
  const [userPerms, setUserPerms] = useState([]); 
  const [userRole, setUserRole] = useState(null); // Để null để biết chưa load xong
  const [selectedTaskId, setSelectedTaskId] = useState('general-notes'); 
  const [isChecking, setIsChecking] = useState(true); // Trạng thái kiểm tra quyền
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate('/login');
      } else {
        setUser(currentUser);

        // ⚡ LẮNG NGHE QUYỀN REALTIME
        const unsubPerms = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const perms = data.permissions || [];
            const role = data.role || 'member';

            setUserPerms(perms);
            setUserRole(role);

            // LOGIC QUAN TRỌNG: Admin luôn pass, Member cần view_tasks
            const hasViewPermission = role === 'admin' || perms.includes('view_tasks');

            if (!hasViewPermission) {
              alert("Bạn không có quyền truy cập khu vực này!");
              navigate('/dashboard');
            }
            setIsChecking(false); // Đã check xong, cho hiện UI
          } else {
            // Nếu user chưa có trong DB (lỗi hiếm)
            setIsChecking(false);
          }
        }, (error) => {
          console.error("Lỗi Firestore:", error);
          setIsChecking(false);
        });

        return () => unsubPerms();
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Quyền sửa: Admin hoặc có edit_tasks
  const canEdit = userRole === 'admin' || userPerms.includes('edit_tasks');

  // Nếu đang check quyền thì hiện loading, tránh việc bị navigate nhầm
  if (isChecking) {
    return <div className="loading-screen">Đang kiểm tra quyền truy cập...</div>;
  }

  return (
    <Layout>
      <div className="tasks-page-container">
        <div className="page-header">
          <div className="header-title">
            <FiCheckCircle size={28} color="#6366f1" />
            <h2>
              Task Collaboration Workspace 
              {!canEdit && <FiLock size={20} title="Chỉ xem" style={{ marginLeft: '10px' }} />}
            </h2>
          </div>
          <p>Chọn một task bên dưới để cùng đồng đội soạn thảo nội dung thời gian thực.</p>
        </div>

        <div className="tasks-content-grid">
          <aside className="tasks-sidebar">
            <h3>Danh sách công việc</h3>
            <div 
              className={`task-item ${selectedTaskId === 'general-notes' ? 'active' : ''}`}
              onClick={() => setSelectedTaskId('general-notes')}
            >
              <FiEdit3 /> <span> Ghi chú chung dự án</span>
            </div>
            <div 
              className={`task-item ${selectedTaskId === 'feature-plan' ? 'active' : ''}`}
              onClick={() => setSelectedTaskId('feature-plan')}
            >
              <FiEdit3 /> <span> Kế hoạch tính năng mới</span>
            </div>
          </aside>

          <main className="editor-workspace">
            <div className="workspace-info">
              {canEdit ? <FiInfo /> : <FiLock color="#f59e0b" />} 
              <span>
                {canEdit 
                  ? "Mọi thay đổi sẽ được đồng bộ ngay lập tức với tất cả thành viên đang xem." 
                  : "Bạn đang ở chế độ CHỈ XEM nội dung này."}
              </span>
            </div>
            
            <CollaborativeEditor 
              docId={selectedTaskId} 
              userName={user?.displayName || user?.email} 
              readOnly={!canEdit} 
            />
          </main>
        </div>
      </div>
    </Layout>
  );
}