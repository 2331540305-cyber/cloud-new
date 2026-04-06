import { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, set, push, serverTimestamp, off, onDisconnect } from 'firebase/database';
import { collection, query, getDocs, addDoc, deleteDoc, doc, orderBy, limit } from 'firebase/firestore';
import { auth, rtdb, db } from '../config/firebase';
import Layout from '../components/Layout';
import Editor from '@monaco-editor/react';
import { FiCode, FiPlus, FiArrowLeft, FiMessageSquare, FiTrash2, FiUsers, FiSend, FiPlay, FiX, FiClock } from 'react-icons/fi';
import '../styles/team-code.css';

export default function Team() {
  const [user, setUser] = useState(null);
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
  
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const timeoutRef = useRef(null);
  const lastSavedCode = useRef(''); 
  const scrollRef = useRef(null);
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  // Hàm định dạng thời gian "X phút trước"
  const formatTime = (ts) => {
    if (!ts) return "Đang lưu...";
    let date = new Date(ts);
    if (isNaN(date.getTime())) return "Đang lưu...";
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 5) return "Vừa xong";
    if (diff < 60) return `${diff} giây trước`;
    const min = Math.floor(diff / 60);
    if (min < 60) return `${min} phút trước`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} giờ trước`;
    return date.toLocaleString("vi-VN");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadTeamFiles();
        setupPresence(currentUser);
        listenToOnlineUsers();
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => { setSrcDoc(code); }, 500);
    return () => clearTimeout(timeout);
  }, [code]);

  // Logic Auto-save Lịch sử (5 giây/lần nếu có thay đổi)
  useEffect(() => {
    if (!selectedFile?.id || !code || !user) return;
    const autoSaveInterval = setInterval(async () => {
      if (code.trim() !== lastSavedCode.current.trim()) {
        try {
          const historyRef = collection(db, 'team_projects', selectedFile.id, 'history');
          await addDoc(historyRef, {
            code: code,
            savedBy: user.displayName || user.email,
            timestamp: Date.now()
          });
          lastSavedCode.current = code;
          if (isHistoryOpen) loadHistory(); 
        } catch (e) { console.error("Lỗi Auto-save:", e); }
      }
    }, 5000);
    return () => clearInterval(autoSaveInterval);
  }, [code, selectedFile?.id, user, isHistoryOpen]);

  // Lắng nghe Code & Chat từ RTDB
  useEffect(() => {
    if (!selectedFile?.id) return;
    const codeRef = ref(rtdb, `team_code/${selectedFile.id}`);
    const chatRef = ref(rtdb, `team_chats/${selectedFile.id}`);

    const unsubCode = onValue(codeRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null && data !== code) {
        setCode(data);
        if (lastSavedCode.current === '') lastSavedCode.current = data;
      }
    });
    const unsubChat = onValue(chatRef, (s) => { 
        setMessages(s.exists() ? Object.values(s.val()) : []); 
    });
    return () => { off(codeRef); off(chatRef); };
  }, [selectedFile?.id]);

  // Hiển thị con trỏ của người khác (Remote Cursor)
  useEffect(() => {
    if (!editorRef.current || !onlineUsers || !user || !selectedFile) return;

    const newDecorations = [];
    Object.entries(onlineUsers).forEach(([uid, data]) => {
      if (uid !== user.uid && data.cursor && data.cursor.fileId === selectedFile.id) {
        newDecorations.push({
          range: {
            startLineNumber: data.cursor.lineNumber,
            startColumn: data.cursor.column,
            endLineNumber: data.cursor.lineNumber,
            endColumn: data.cursor.column + 1
          },
          options: {
            className: 'remote-cursor',
            hoverMessage: { value: `Đang gõ: ${data.name}` },
            beforeContentClassName: 'remote-cursor-label',
          }
        });
      }
    });

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [onlineUsers, selectedFile, user]);

  const loadTeamFiles = async () => {
    const snap = await getDocs(query(collection(db, 'team_projects')));
    setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const loadHistory = async () => {
    if (!selectedFile) return;
    setIsLoadingHistory(true);
    try {
      const historyRef = collection(db, 'team_projects', selectedFile.id, 'history');
      const q = query(historyRef, orderBy('timestamp', 'desc'), limit(15));      
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error("Lỗi tải lịch sử:", e); }
    finally { setIsLoadingHistory(false); }
  };

  const handleCodeChange = (value) => {
    setCode(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      set(ref(rtdb, `team_code/${selectedFile.id}`), value);
    }, 400);
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      if (user && selectedFile) {
        set(ref(rtdb, `presence/${user.uid}/cursor`), {
          lineNumber: e.position.lineNumber,
          column: e.position.column,
          fileId: selectedFile.id
        });
      }
    });
  };

  const restoreVersion = (oldCode) => {
    if (window.confirm("Khôi phục phiên bản này? Code hiện tại sẽ bị ghi đè.")) {
      handleCodeChange(oldCode);
      setIsHistoryOpen(false);
    }
  };

  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const docRef = await addDoc(collection(db, 'team_projects'), {
      fileName: newFileName.endsWith('.html') ? newFileName : `${newFileName}.html`,
      createdBy: user.email,
      createdAt: new Date()
    });
    await set(ref(rtdb, `team_code/${docRef.id}`), `<html><body><h1>Project Mới</h1></body></html>`);
    setIsCreating(false);
    setNewFileName('');
    loadTeamFiles();
  };

  const setupPresence = (u) => {
    const pRef = ref(rtdb, `presence/${u.uid}`);
    set(pRef, { name: u.displayName || u.email, photo: u.photoURL });
    onDisconnect(pRef).remove();
  };

  const listenToOnlineUsers = () => onValue(ref(rtdb, 'presence'), (s) => setOnlineUsers(s.val() || {}));

  // Tự động scroll chat xuống cuối
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  if (!selectedFile) {
    return (
      <Layout>
        <div className="file-selector-container">
          <div className="selector-header"><h2><FiUsers /> Team Hub</h2></div>
          <div className="file-grid">
            {files.map(f => (
              <div key={f.id} className="file-card" onClick={() => setSelectedFile(f)}>
                <FiCode size={30} color="#6366f1" />
                <div className="file-info"><strong>{f.fileName}</strong></div>
                <button className="btn-delete-file" onClick={(e) => { e.stopPropagation(); if(window.confirm("Xóa file này?")) { deleteDoc(doc(db, 'team_projects', f.id)); loadTeamFiles(); } }}><FiTrash2 /></button>
              </div>
            ))}
            <div className="file-card add-new" onClick={() => setIsCreating(true)}><FiPlus size={40} /><p>Tạo file</p></div>
          </div>
          {isCreating && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Tạo file mới</h3>
                <form onSubmit={handleCreateFile}>
                  <input autoFocus value={newFileName} onChange={e => setNewFileName(e.target.value)} placeholder="Tên file..." />
                  <div className="modal-actions">
                    <button type="button" onClick={() => setIsCreating(false)}>Hủy</button>
                    <button type="submit">Tạo</button>
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
            <div className="header-left">
              <button className="btn-icon" onClick={() => setSelectedFile(null)}><FiArrowLeft /></button>
              <span>{selectedFile.fileName}</span>
            </div>
            <div className="header-right">
              {/* Hiển thị Avatar những người đang online */}
              <div className="online-avatars">
                {Object.values(onlineUsers).map((u, i) => (
                  <img 
                    key={i} 
                    src={u.photo || `https://ui-avatars.com/api/?name=${u.name}`} 
                    className="user-avatar-mini" 
                    title={u.name}
                    alt="avatar" 
                  />
                ))}
              </div>
              <button 
                className="btn-icon" 
                onClick={() => { setIsHistoryOpen(prev => { if (!prev) loadHistory(); return !prev; }); }}
                title="Lịch sử bản lưu"
              >
                <FiClock color={isHistoryOpen ? "#6366f1" : "white"} />
              </button>
            </div>
          </div>
          
          <div className="editor-wrapper" style={{ position: 'relative', flex: 1 }}>
            <Editor 
              height="100%" 
              theme="vs-dark" 
              defaultLanguage="html" 
              value={code} 
              onChange={handleCodeChange} 
              onMount={handleEditorDidMount} 
              options={{ automaticLayout: true, minimap: { enabled: false } }} 
            />
            
            {/* Bảng lịch sử hiện ra khi bấm nút Clock */}
            {isHistoryOpen && (
              <div className="history-panel">
                <div className="history-header">
                  <span>Lịch sử bản lưu</span>
                  <FiX className="pointer" onClick={() => setIsHistoryOpen(false)} />
                </div>
                <div className="history-list">
                  {isLoadingHistory ? <div className="empty-text">Đang tải...</div> : history.map(h => (
                    <div key={h.id} className="history-item" onClick={() => restoreVersion(h.code)}>
                      <strong title={new Date(h.timestamp).toLocaleString()}>
                        {formatTime(h.timestamp)}
                      </strong>
                      <small>Sửa bởi: {h.savedBy?.split('@')[0]}</small>
                    </div>
                  ))}
                  {!isLoadingHistory && history.length === 0 && <div className="empty-text">Chưa có bản lưu.</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="preview-section">
          <div className="section-header preview-label"><FiPlay /> Live Preview</div>
          <iframe srcDoc={srcDoc} title="output" sandbox="allow-scripts" frameBorder="0" className="preview-iframe" />
        </div>

        {/* Chat Nổi (Floating Chat) */}
        <div className={`floating-chat ${isChatOpen ? 'open' : ''}`}>
          {isChatOpen && (
            <div className="chat-window">
              <div className="chat-header">Team Chat</div>
              <div className="chat-messages" ref={scrollRef}>
                {messages.map((m, i) => (
                  <div key={i} className={`msg ${m.user === (user?.displayName || user?.email) ? 'mine' : ''}`}>
                    <small>{m.user?.split('@')[0]}</small>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>
              <form className="chat-input" onSubmit={(e) => { 
                e.preventDefault(); 
                if(!inputMsg.trim()) return; 
                push(ref(rtdb, `team_chats/${selectedFile.id}`), { 
                  user: user.displayName || user.email, 
                  text: inputMsg, 
                  timestamp: serverTimestamp() 
                }); 
                setInputMsg(''); 
              }}>
                <input value={inputMsg} onChange={e => setInputMsg(e.target.value)} placeholder="Nhắn tin..." />
                <button type="submit"><FiSend /></button>
              </form>
            </div>
          )}
          <button className="chat-toggle" onClick={() => setIsChatOpen(!isChatOpen)}>
            {isChatOpen ? <FiX /> : <FiMessageSquare />}
          </button>
        </div>
      </div>
    </Layout>
  );
}
