import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, get, set } from 'firebase/database'; 
import { rtdb, auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Layout from '../components/Layout';
import CollaborativeEditor from '../components/CollaborativeEditor';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';

export default function EditPage() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAndInitFile = async () => {
      const fileRef = ref(rtdb, `documents/${fileId}`);
      const snapshot = await get(fileRef);

      if (!snapshot.exists()) {

        await set(fileRef, "Chào mừng bạn đến với trình soạn thảo file!"); 
      }
      setIsReady(true);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/login');
      else checkAndInitFile();
    });

    return () => unsubscribe();
  }, [fileId, navigate]);

  if (!isReady) return <div style={{padding: '20px'}}>Đang chuẩn bị phòng soạn thảo...</div>;

  return (
    <Layout>
      <div className="edit-page-container">
        <div className="edit-nav">
           <button className="btn-back" onClick={() => navigate('/upload')}>
             <FiArrowLeft /> Quay lại
           </button>
           <div className="file-status">
             <FiFileText /> Sửa file: {fileId.substring(0,8)}
           </div>
        </div>

        <CollaborativeEditor docId={fileId} />
      </div>
    </Layout>
  );
}