import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function RealtimeEditor({ taskId }) {
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'tasks', taskId);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists() && !isTyping) { 
        setContent(doc.data().description);
      }
    });
    return () => unsubscribe();
  }, [taskId, isTyping]);

  const handleChange = async (value) => {
    setContent(value);
    setIsTyping(true);

    const docRef = doc(db, 'tasks', taskId);
    await updateDoc(docRef, { description: value });

    setTimeout(() => setIsTyping(false), 1000);
  };

  return (
    <div className="editor-wrapper">
      <ReactQuill 
        value={content} 
        onChange={handleChange} 
        theme="snow"
        placeholder="Cùng nhau soạn thảo nội dung task này..."
      />
    </div>
  );
}