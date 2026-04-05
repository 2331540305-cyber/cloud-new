import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const firebaseConfig = {
apiKey: "AIzaSyAIik8RpH3HwZGcNesZME9JHBDrtmGn8Rg",
authDomain: "coworking-cloud-demo.firebaseapp.com",
projectId: "coworking-cloud-demo",
storageBucket: "coworking-cloud-demo.firebasestorage.app",
messagingSenderId: "633384649932",
appId: "1:633384649932:web:0a5f03c1dcd2b598d72e69"
};

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
