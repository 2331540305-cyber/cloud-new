import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { supabase } from '../config/supabase';
import Layout from '../components/Layout';
import { FiCloud, FiUpload, FiPaperclip, FiFolder, FiInbox, FiFile, FiDownload, FiTrash2, FiInfo, FiEdit3 } from 'react-icons/fi';
import '../styles/upload.css';

export default function Upload() {
  const [user, setUser] = useState(null);
  const [userPerms, setUserPerms] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) { navigate('/login'); return; }
      setUser(currentUser);
      
      // ⚡ LẮNG NGHE QUYỀN REALTIME
      onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
        if (snap.exists()) setUserPerms(snap.data().permissions || []);
      });

      loadFiles(currentUser.uid);
    });
    return () => unsubscribe();
  }, [navigate]);

  const canUpload = userPerms.includes('upload_files');
  const canDelete = userPerms.includes('delete_files');

  const loadFiles = async (userId) => {
    try {
      const q = query(collection(db, 'files'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      setFiles(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleUploadFile = async (e) => {
    if (!canUpload) return alert("Bạn không có quyền tải lên!");
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const filePath = `${user.uid}/${Date.now()}_${file.name}`;
      const progressInterval = setInterval(() => { setUploadProgress(prev => Math.min(prev + 20, 90)); }, 200);
      const { error } = await supabase.storage.from("files").upload(filePath, file);
      if (error) throw error;
      clearInterval(progressInterval);
      setUploadProgress(100);
      const { data: urlData } = supabase.storage.from("files").getPublicUrl(filePath);
      await addDoc(collection(db, 'files'), {
        userId: user.uid,
        fileName: file.name,
        fileSize: file.size,
        fileUrl: urlData.publicUrl,
        filePath: filePath,
        uploadedAt: new Date()
      });
      loadFiles(user.uid);
    } catch (error) { alert(error.message); } finally { setUploading(false); setUploadProgress(0); }
  };

  const handleDelete = async (file) => {
    if (!canDelete) return alert("Bạn không có quyền xóa!");
    if (!confirm(`Delete "${file.fileName}"?`)) return;
    try {
      await supabase.storage.from("files").remove([file.filePath]);
      await deleteDoc(doc(db, 'files', file.id));
      loadFiles(user.uid);
    } catch (error) { alert(error.message); }
  };

  if (loading) return <Layout><div className="loading-container"><div className="spinner"></div><p>Loading files...</p></div></Layout>;

  return (
    <Layout>
      <div className="upload-container">
        <div className="upload-header">
          <h1><FiCloud size={36} /> Supabase Storage</h1>
          <p>Upload and manage your files securely with Supabase Cloud</p>
        </div>
        <div className="upload-content">
          <div className="upload-box">
            <div className="upload-form">
              <h2><FiUpload size={24} /> Upload File</h2>
              <div className="file-input-wrapper">
                <input type="file" id="fileInput" onChange={handleUploadFile} disabled={uploading || !canUpload} className="file-input" />
                <label htmlFor="fileInput" className={`file-label ${!canUpload ? 'disabled' : ''}`}>
                  <span className="file-icon"><FiPaperclip size={32} /></span>
                  <span className="file-text">{canUpload ? "Click or drag file here..." : "Quyền upload đã bị Admin khóa"}</span>
                </label>
              </div>
              {uploadProgress > 0 && (
                <div className="progress-container">
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div></div>
                </div>
              )}
            </div>
            <div className="upload-info">
              <h3><FiInfo size={20} /> Features</h3>
              <ul><li>Max size: 100MB</li><li>Cloud Storage by Supabase</li></ul>
            </div>
          </div>
          <div className="files-box">
            <h2><FiFolder size={24} /> Your Files ({files.length})</h2>
            <div className="files-table">
              <div className="table-header">
                <div className="col-name">File Name</div><div className="col-actions">Actions</div>
              </div>
              <div className="table-body">
                {files.map((file) => (
                  <div key={file.id} className="table-row">
                    <div className="col-name"><FiFile /><span className="file-name">{file.fileName}</span></div>
                    <div className="col-actions">
                      <button className="btn-icon" onClick={() => navigate(`/edit/${file.id}`)}><FiEdit3 /></button>
                      <button className="btn-icon" onClick={() => window.open(file.fileUrl)}><FiDownload /></button>
                      {canDelete && (
                        <button className="btn-icon btn-delete" onClick={() => handleDelete(file)}><FiTrash2 /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}