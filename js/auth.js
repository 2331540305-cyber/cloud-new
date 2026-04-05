import { getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut }

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { doc,setDoc }

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { app,db } from "./firebase.js";

const auth = getAuth(app);


const registerForm = document.getElementById("registerForm");

if(registerForm){

registerForm.addEventListener("submit",(e)=>{

e.preventDefault();

const email=document.getElementById("email").value;
const password=document.getElementById("password").value;

createUserWithEmailAndPassword(auth,email,password)

.then(async(userCredential)=>{

const user=userCredential.user;

await setDoc(doc(db,"users",user.uid),{

email:email,
role:"member",
permissions:["view_tasks","view_team","view_uploads"]

});

alert("Register success");

window.location.href="login.html";

})

.catch(err=>alert(err.message));

});

}


const loginForm=document.getElementById("loginForm");

if(loginForm){

loginForm.addEventListener("submit",(e)=>{

e.preventDefault();

const email=document.getElementById("email").value;
const password=document.getElementById("password").value;

signInWithEmailAndPassword(auth,email,password)

.then(()=>{

window.location.href="dashboard.html";

})

.catch(err=>alert(err.message));

});

}


const logoutBtn=document.getElementById("logoutBtn");

if(logoutBtn){

logoutBtn.addEventListener("click",()=>{

signOut(auth).then(()=>{

window.location.href="login.html";

})

});

}
