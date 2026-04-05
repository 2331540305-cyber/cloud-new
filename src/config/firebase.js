import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database"; // Thêm cái này

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY || "AIzaSyAIik8RpH3HwZGcNesZME9JHBDrtmGn8Rg",
  authDomain: import.meta.env.VITE_AUTH_DOMAIN || "coworking-cloud-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_PROJECT_ID || "coworking-cloud-demo",
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET || "coworking-cloud-demo.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID || "633384649932",
  appId: import.meta.env.VITE_APP_ID || "1:633384649932:web:0a5f03c1dcd2b598d72e69",
  databaseURL: "https://coworking-cloud-demo-default-rtdb.asia-southeast1.firebasedatabase.app" // Thêm URL của Realtime DB ở đây
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app); // Xuất rtdb ra để dùng
export const googleProvider = new GoogleAuthProvider();