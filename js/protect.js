import { getAuth,onAuthStateChanged }

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { app } from "./firebase.js";

const auth=getAuth(app);

onAuthStateChanged(auth,(user)=>{

if(!user){

window.location.href="login.html";

}

});
