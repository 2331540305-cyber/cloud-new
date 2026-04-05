import { useEffect, useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ref, onValue, set, off } from 'firebase/database';
import { rtdb } from '../config/firebase';
import { FiUsers, FiSave, FiLock } from 'react-icons/fi';
import '../styles/editor.css';

export default function CollaborativeEditor({ docId, userName, readOnly }) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Đang kết nối...');
  const quillRef = useRef(null);
  const isIncomingUpdate = useRef(false); 

  useEffect(() => {
    if (!docId) return;

    const docRef = ref(rtdb, `documents/${docId}`);

    const unsubscribe = onValue(docRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        isIncomingUpdate.current = true; 
        setContent(data);
      }
      // Cập nhật trạng thái dựa trên quyền readOnly
      setStatus(readOnly ? 'Chế độ chỉ xem' : 'Sẵn sàng soạn thảo');
    });

    return () => off(docRef);
  }, [docId, readOnly]); 

  const handleEditorChange = (value, delta, source) => {
    // 🔒 CHẶN GHI: Nếu là user gõ VÀ không có quyền readOnly thì mới lưu
    if (source === 'user' && !readOnly) {
      setContent(value);
      const docRef = ref(rtdb, `documents/${docId}`);
      set(docRef, value).catch(err => setStatus('Lỗi đồng bộ!'));
    }
  };

  // Cấu hình Toolbar: Tự động ẩn thanh công cụ nếu readOnly để tránh bối rối cho user
  const currentModules = {
    toolbar: readOnly ? false : [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'color', 'background'],
      ['clean']
    ],
  };

  return (
    <div className={`realtime-editor-box ${readOnly ? 'mode-readonly' : ''}`}>
      <div className="editor-toolbar-top">
        <div className={`status-badge ${readOnly ? 'locked' : ''}`}>
          {readOnly ? <FiLock /> : <FiUsers className="icon-pulse" />}
          <span>{status}</span>
        </div>
        <div className="doc-info">
          ID Tài liệu: <strong>{docId}</strong>
        </div>
      </div>
      
      <ReactQuill
        readOnly={readOnly} 
        theme="snow"
        ref={quillRef}
        value={content}
        onChange={handleEditorChange}
        modules={currentModules} 
        placeholder={readOnly ? "Nội dung này hiện đang bị khóa chỉnh sửa..." : "Nhập nội dung tài liệu chung tại đây..."}
      />
      
      <div className="editor-footer">
        {readOnly ? (
          <span><FiLock /> Bạn không có quyền thay đổi tài liệu này</span>
        ) : (
          <span><FiSave /> Tự động lưu vào Cloud khi bạn gõ</span>
        )}
      </div>
    </div>
  );
}