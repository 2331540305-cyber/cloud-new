import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export function usePermissions() {
  const [permissions, setPermissions] = useState([]);
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // ⚡ Lắng nghe REALTIME thay đổi từ Firestore
        const unsubDoc = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val?.() || snapshot.data(); // Hỗ trợ cả RTDB/Firestore tùy cấu hình
            setPermissions(data.permissions || []);
            setRole(data.role || 'member');
          }
          setLoading(false);
        });
        return () => unsubDoc();
      } else {
        setPermissions([]);
        setRole('member');
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const hasPermission = (perm) => role === 'admin' || permissions.includes(perm);

  return { permissions, role, hasPermission, loading };
}