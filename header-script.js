import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDJRm9-jRkxVrTLYBzK1gGrRmAEu29jVrU",
  authDomain: "diamond-recharge-f7f59.firebaseapp.com",
  projectId: "diamond-recharge-f7f59",
  storageBucket: "diamond-recharge-f7f59.appspot.com",
  messagingSenderId: "657717928489",
  appId: "1:657717928489:web:70431ebc9afb7002d4b238",
  measurementId: "G-TDK78BQ8SQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function el(id) { return document.getElementById(id); }

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      el("user-email").textContent = data.email;
      el("user-balance").textContent = `💎 ${data.balance ?? 0}`;
    } else {
      el("user-email").textContent = user.email;
      el("user-balance").textContent = "💎 0";
    }
    if (user.photoURL) {
      el("user-photo").src = user.photoURL;
    } else {
      el("user-photo").src = "default-avatar.png";
    }
    el("auth-btn").textContent = "Logout";
    el("auth-btn").onclick = async () => { await signOut(auth); location.reload(); };
  } else {
    el("user-email").textContent = "";
    el("user-balance").textContent = "💎 0";
    el("user-photo").src = "default-avatar.png";
    el("auth-btn").textContent = "Login";
    el("auth-btn").onclick = async () => {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    };
  }
});
