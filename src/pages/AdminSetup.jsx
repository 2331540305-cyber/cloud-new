import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { FiShield, FiUser, FiCheckCircle } from 'react-icons/fi';
import '../styles/admin.css';

export default function AdminSetup() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null); // Lưu ID thay vì Object để đồng bộ tốt hơn
  const navigate = useNavigate();

  // Danh sách các quyền hệ thống
  const availablePermissions = [
    { id: 'view_tasks', label: 'Xem công việc' },
    { id: 'edit_tasks', label: 'Sửa công việc' },
    { id: 'delete_tasks', label: 'Xóa công việc' },
    { id: 'view_team', label: 'Xem nhóm' },
    { id: 'edit_team', label: 'Quản lý nhóm' },
    { id: 'view_uploads', label: 'Xem file' },
    { id: 'upload_files', label: 'Tải lên file' },
    { id: 'delete_files', label: 'Xóa file' }
  ];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentUser(user);

      // Kiểm tra quyền Admin
      const adminRef = doc(db, 'users', user.uid);
      const adminSnap = await getDoc(adminRef);
      if (adminSnap.exists() && adminSnap.data()?.role !== 'admin') {
        alert("Bạn không có quyền truy cập trang này!");
        navigate('/dashboard');
      }
    });

    // ⚡ Lắng nghe danh sách tất cả người dùng REALTIME
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllUsers(usersList);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
    };
  }, [navigate]);

  // Tìm thông tin user đang được chọn từ danh sách allUsers (để lấy data mới nhất)
  const selectedUser = allUsers.find(u => u.id === selectedUserId);

  // Hàm cập nhật quyền hoặc Role
  const handleUpdateUser = async (userId, newData) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, newData);
      // Không cần alert ở đây để trải nghiệm mượt mà hơn (Realtime sẽ tự nhảy checkbox)
    } catch (error) {
      alert('Lỗi cập nhật: ' + error.message);
    }
  };

  // Hàm xử lý tick/untick quyền
  const togglePermission = (user, permId) => {
    const currentPerms = user.permissions || [];
    const newPerms = currentPerms.includes(permId)
      ? currentPerms.filter(p => p !== permId)
      : [...currentPerms, permId];
    
    handleUpdateUser(user.id, { permissions: newPerms });
  };

  if (loading) return <div className="loading">Đang tải danh sách thành viên...</div>;

  return (
    <div className="admin-setup-container">
      <div className="setup-header">
        <h1><FiShield /> Quản trị hệ thống</h1>
        <p>Cấp quyền và quản lý vai trò thành viên</p>
      </div>

      <div className="admin-grid">
        {/* CỘT TRÁI: DANH SÁCH THÀNH VIÊN */}
        <div className="user-list-section">
          <h2>Danh sách thành viên ({allUsers.length})</h2>
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Thành viên</th>
                  <th>Vai trò</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map(u => (
                  <tr key={u.id} className={selectedUserId === u.id ? 'active' : ''}>
                    <td onClick={() => setSelectedUserId(u.id)}>
                      <div className="user-cell">
                        <img src={u.photoURL || 'https://ui-avatars.com/api/?name=' + u.displayName} alt="avatar" />
                        <div>
                          <p className="name">{u.displayName || 'Người dùng'}</p>
                          <p className="email">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${u.role}`}>{u.role?.toUpperCase()}</span>
                    </td>
                    <td>
                      <button 
                        className="btn-edit" 
                        onClick={() => setSelectedUserId(u.id)}
                      >
                        Sửa quyền
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CỘT PHẢI: CHI TIẾT & CHỈNH SỬA QUYỀN */}
        <div className="permissions-edit-section">
          {selectedUser ? (
            <div className="edit-card">
              <div className="edit-card-header">
                <img src={selectedUser.photoURL || 'https://ui-avatars.com/api/?name=' + selectedUser.displayName} alt="avatar" />
                <h2>{selectedUser.displayName}</h2>
              </div>
              
              <div className="role-toggle">
                <label>Vai trò chính:</label>
                <select 
                  value={selectedUser.role || 'user'} 
                  onChange={(e) => handleUpdateUser(selectedUser.id, { role: e.target.value })}
                >
                  <option value="user">User (Người dùng)</option>
                  <option value="admin">Admin (Quản trị viên)</option>
                </select>
              </div>

              <hr />

              <h3>Danh sách quyền chi tiết</h3>
              <div className="permissions-grid">
                {availablePermissions.map(perm => (
                  <div key={perm.id} className="perm-item">
                    <input 
                      type="checkbox" 
                      id={perm.id}
                      checked={selectedUser.permissions?.includes(perm.id) || false}
                      onChange={() => togglePermission(selectedUser, perm.id)}
                    />
                    <label htmlFor={perm.id}>{perm.label}</label>
                  </div>
                ))}
              </div>
              
              <div className="note-box">
                <FiCheckCircle />
                <span>Thay đổi sẽ có hiệu lực ngay lập tức cho người dùng này.</span>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <FiUser size={64} />
              <p>Chọn một thành viên bên trái để chỉnh sửa quyền hạn</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}