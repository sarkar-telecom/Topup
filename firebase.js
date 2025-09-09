// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// আপনার Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBIIOv-2Laqugv5_HAIRNJllp8YUfYndF8",
  authDomain: "diamond-recharge-f7f59.firebaseapp.com",
  projectId: "diamond-recharge-f7f59",
  storageBucket: "diamond-recharge-f7f59.appspot.com",
  messagingSenderId: "657717928489",
  appId: "1:657717928489:web:70431ebc9afb7002d4b238"
};

// একবার initialize
const app = initializeApp(firebaseConfig);

// Auth & Firestore export করা হলো
export const auth = getAuth(app);
export const db = getFirestore(app);