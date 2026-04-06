import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, addDoc, deleteDoc, doc, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { supabase } from '../config/supabase';
import Layout from '../components/Layout';
import { FiCloud, FiUpload, FiPaperclip, FiFolder, FiFile, FiDownload, FiTrash2, FiInfo, FiEdit3, FiUser, FiHardDrive } from 'react-icons/fi';
import '../styles/upload.css';

export default function Upload() {
  const [user, setUser] = useState(null);
  const [userPerms, setUserPerms] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  // Hàm định dạng dung lượng file
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);

      // 1. Lắng nghe quyền hạn (Realtime)
      const unsubPerms = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
        if (snap.exists()) setUserPerms(snap.data().permissions || []);
      });

      // 2. Lắng nghe TẤT CẢ FILES của nhóm (Realtime)
      const q = query(collection(db, 'files'), orderBy('uploadedAt', 'desc'));
      const unsubFiles = onSnapshot(q, (snapshot) => {
        const allFiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFiles(allFiles);
        setLoading(false);
      }, (err) => {
        console.error("Lỗi lấy dữ liệu:", err);
        setLoading(false);
      });

      return () => {
        unsubPerms();
        unsubFiles();
      };
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const canUpload = userPerms.includes('upload_files');
  const canDelete = userPerms.includes('delete_files');

  const handleUploadFile = async (e) => {
    if (!canUpload) return alert("Bạn không có quyền tải lên!");
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const filePath = `${user.uid}/${Date.now()}_${file.name}`;
      
      // Giả lập thanh tiến trình
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 150);

      const { error } = await supabase.storage.from("files").upload(filePath, file);
      if (error) throw error;

      clearInterval(progressInterval);
      setUploadProgress(100);

      const { data: urlData } = supabase.storage.from("files").getPublicUrl(filePath);

      // FIX LỖI ẨN DANH: Lấy tên từ DisplayName hoặc cắt từ Email
      const displayName = user.displayName || user.email.split('@')[0];

      await addDoc(collection(db, 'files'), {
        userId: user.uid,
        userName: displayName, // Lưu tên rõ ràng vào DB
        userEmail: user.email,
        fileName: file.name,
        fileSize: file.size,
        fileUrl: urlData.publicUrl,
        filePath: filePath,
        uploadedAt: new Date()
      });

    } catch (error) {
      alert("Lỗi tải lên: " + error.message);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleDelete = async (file) => {
    if (!canDelete) return alert("Bạn không có quyền xóa!");
    if (!confirm(`Xóa vĩnh viễn file "${file.fileName}"?`)) return;

    try {
      await supabase.storage.from("files").remove([file.filePath]);
      await deleteDoc(doc(db, 'files', file.id));
    } catch (error) {
      alert("Lỗi khi xóa: " + error.message);
    }
  };

  if (loading) return <Layout><div className="loading-container"><div className="spinner"></div><p>Đang tải kho file nhóm...</p></div></Layout>;

  return (
    <Layout>
      <div className="upload-container">
        <div className="upload-header">
          <h1><FiCloud size={36} /> Supabase Storage</h1>
          <p>Hệ thống lưu trữ đám mây dùng chung cho toàn bộ thành viên trong nhóm</p>
        </div>

        <div className="upload-content">
          <div className="upload-box">
            <div className="upload-form">
              <h2><FiUpload size={24} /> Tải file mới</h2>
              <div className="file-input-wrapper">
                <input type="file" id="fileInput" onChange={handleUploadFile} disabled={uploading || !canUpload} className="file-input" />
                <label htmlFor="fileInput" className={`file-label ${(!canUpload || uploading) ? 'disabled' : ''}`}>
                  <span className="file-icon"><FiPaperclip size={32} /></span>
                  <span className="file-text">
                    {uploading ? `Đang tải lên (${uploadProgress}%)` : canUpload ? "Nhấn để chọn hoặc kéo thả file" : "Bạn không có quyền Upload"}
                  </span>
                </label>
              </div>
              {uploadProgress > 0 && (
                <div className="progress-container">
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div></div>
                </div>
              )}
            </div>

            <div className="upload-info">
              <h3><FiInfo size={20} /> Quy định bộ nhớ</h3>
              <ul>
                <li>Dung lượng tối đa: 100MB</li>
                <li>Mọi người đều có thể xem và tải về</li>
                <li>Chỉ Admin/Người có quyền mới được xóa</li>
              </ul>
            </div>
          </div>

          <div className="files-box">
            <h2><FiFolder size={24} /> Danh sách file nhóm ({files.length})</h2>
            <div className="files-table">
              <div className="table-header">
                <div className="col-name">Tên File</div>
                <div className="col-user">Người đăng</div>
                <div className="col-size">Dung lượng</div>
                <div className="col-actions">Thao tác</div>
              </div>
              <div className="table-body">
                {files.length === 0 ? (
                  <div className="empty-state">Chưa có dữ liệu trong kho file.</div>
                ) : (
                  files.map((file) => (
                    <div key={file.id} className="table-row">
                      <div className="col-name">
                        <FiFile className="icon-file" />
                        <span className="file-text-name" title={file.fileName}>{file.fileName}</span>
                      </div>
                      <div className="col-user">
                        <span className="badge-user">
                          <FiUser size={10} /> {file.userName || "Thành viên"}
                        </span>
                      </div>
                      <div className="col-size">
                        <small>{formatFileSize(file.fileSize)}</small>
                      </div>
                      <div className="col-actions">
                        <button className="btn-action" onClick={() => navigate(`/edit/${file.id}`)} title="Chỉnh sửa"><FiEdit3 /></button>
                        <button className="btn-action" onClick={() => window.open(file.fileUrl)} title="Tải xuống"><FiDownload /></button>
                        {canDelete && (
                          <button className="btn-action btn-del" onClick={() => handleDelete(file)} title="Xóa"><FiTrash2 /></button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 
