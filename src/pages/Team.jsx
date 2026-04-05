import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, set, push, serverTimestamp, off, onDisconnect } from 'firebase/database';
import { collection, query, getDocs, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { auth, rtdb, db } from '../config/firebase';
import Layout from '../components/Layout';
import Editor from '@monaco-editor/react';
import { FiCode, FiPlus, FiArrowLeft, FiMessageSquare, FiTrash2, FiUsers, FiSend, FiPlay, FiX, FiClock, FiLock } from 'react-icons/fi';
import '../styles/team-code.css';

export default function Team() {
  const [user, setUser] = useState(null);
  const [userPerms, setUserPerms] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [code, setCode] = useState('');
  const [srcDoc, setSrcDoc] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigate = useNavigate();
  const editorRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return navigate('/login');
      setUser(currentUser);
      
      // ⚡ LẮNG NGHE QUYỀN REALTIME
      const unsubPerms = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
        if (snap.exists()) {
          const perms = snap.data().permissions || [];
          setUserPerms(perms);
          // Nếu bị mất quyền xem, đá ra dashboard
          if (!perms.includes('view_team') && snap.data().role !== 'admin') {
            navigate('/dashboard');
          }
        }
      });

      loadTeamFiles();
      setupPresence(currentUser);
      return () => { unsubPerms(); };
    }, [navigate]);
    return () => unsubscribe();
  }, []);

  // Check quyền cụ thể
  const canEdit = userPerms.includes('edit_team') || user?.role === 'admin';

  useEffect(() => {
    const timeout = setTimeout(() => { setSrcDoc(code); }, 500);
    return () => clearTimeout(timeout);
  }, [code]);

  useEffect(() => {
    if (!selectedFile?.id) return;
    const codeRef = ref(rtdb, `team_code/${selectedFile.id}`);
    const unsubCode = onValue(codeRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null && data !== code) setCode(data);
    });
    return () => off(codeRef);
  }, [selectedFile?.id]);

  const loadTeamFiles = async () => {
    const snap = await getDocs(query(collection(db, 'team_projects')));
    setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleCodeChange = (value) => {
    if (!canEdit) return; // Khóa gõ
    setCode(value);
    set(ref(rtdb, `team_code/${selectedFile.id}`), value);
  };

  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!canEdit) return alert("Bạn không có quyền tạo file!");
    const docRef = await addDoc(collection(db, 'team_projects'), {
      fileName: newFileName.endsWith('.html') ? newFileName : `${newFileName}.html`,
      createdBy: user.email,
      createdAt: new Date()
    });
    await set(ref(rtdb, `team_code/${docRef.id}`), `<html><body><h1>Project Mới</h1></body></html>`);
    setIsCreating(false);
    loadTeamFiles();
  };

  const setupPresence = (u) => {
    const pRef = ref(rtdb, `presence/${u.uid}`);
    set(pRef, { name: u.displayName || u.email, photo: u.photoURL });
    onDisconnect(pRef).remove();
  };

  if (!selectedFile) {
    return (
      <Layout>
        <div className="file-selector-container">
          <div className="selector-header"><h2><FiUsers /> Team Code Hub</h2></div>
          <div className="file-grid">
            {files.map(f => (
              <div key={f.id} className="file-card" onClick={() => setSelectedFile(f)}>
                <FiCode size={30} color="#6366f1" />
                <div className="file-info"><strong>{f.fileName}</strong></div>
                {canEdit && (
                   <button className="btn-delete-file" onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, 'team_projects', f.id)); loadTeamFiles(); }}><FiTrash2 /></button>
                )}
              </div>
            ))}
            {canEdit && (
              <div className="file-card add-new" onClick={() => setIsCreating(true)}><FiPlus size={40} /><p>Tạo file</p></div>
            )}
          </div>
          {isCreating && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Tạo file code mới</h3>
                <form onSubmit={handleCreateFile}>
                  <input autoFocus value={newFileName} onChange={e => setNewFileName(e.target.value)} placeholder="Tên file..." />
                  <div className="modal-actions">
                    <button type="button" onClick={() => setIsCreating(false)}>Hủy</button>
                    <button type="submit">Tạo ngay</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="team-workspace">
        <div className="code-section">
          <div className="section-header">
             <button className="btn-icon" onClick={() => setSelectedFile(null)}><FiArrowLeft /></button>
             <span>{selectedFile.fileName} {!canEdit && <FiLock title="Chế độ chỉ xem" />}</span>
          </div>
          <div className="editor-wrapper">
            <Editor 
              height="100%" 
              theme="vs-dark" 
              defaultLanguage="html" 
              value={code} 
              onChange={handleCodeChange} 
              options={{ 
                readOnly: !canEdit, // 🔒 KHÓA EDITOR NẾU MẤT QUYỀN
                automaticLayout: true, 
                minimap: { enabled: false } 
              }} 
            />
          </div>
        </div>
        <div className="preview-section">
          <div className="section-header"><FiPlay /> Live Preview</div>
          <iframe srcDoc={srcDoc} title="output" sandbox="allow-scripts" className="preview-iframe" />
        </div>
      </div>
    </Layout>
  );
}