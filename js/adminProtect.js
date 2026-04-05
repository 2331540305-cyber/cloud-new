import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { app, db } from "./firebase.js";

const auth = getAuth(app);

onAuthStateChanged(auth,async(user)=>{

if(!user){

window.location.href="login.html";
return;

}

const docRef=doc(db,"users",user.uid);
const docSnap=await getDoc(docRef);

if(docSnap.exists()){

const role=docSnap.data().role;

if(role!=="admin"){

alert("Admin only");

window.location.href="dashboard.html";

}

}

});
