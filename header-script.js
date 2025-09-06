// header-script.js  (ES module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// --------- Put your firebase config here (keep storageBucket .appspot.com) -----------
const firebaseConfig = {
  apiKey: "AIzaSyDJRm9-jRkxVrTLYBzK1gGrRmAEu29jVrU",
  authDomain: "diamond-recharge-f7f59.firebaseapp.com",
  projectId: "diamond-recharge-f7f59",
  storageBucket: "diamond-recharge-f7f59.appspot.com",
  messagingSenderId: "657717928489",
  appId: "1:657717928489:web:70431ebc9afb7002d4b238",
  measurementId: "G-TDK78BQ8SQ"
};

// initialize once
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  // if already initialized in same page, ignore
  console.warn("Firebase init warning:", e);
}

// small helpers
const $ = id => document.getElementById(id);

function setLoggedOutUI(){
  if($("user-email")) $("user-email").textContent = "";
  if($("user-balance")) $("user-balance").textContent = "💎 0";
  if($("user-photo")) $("user-photo").src = "https://sarkar-telecom.github.io/Topup/default-avatar.png";
  if($("auth-btn")) {
    $("auth-btn").textContent = "Login";
    $("auth-btn").onclick = () => { window.location.href = "login.html"; };
  }
  try { localStorage.removeItem("user"); } catch(e){}
}

function setLoggedInUI(user, docData){
  const email = (docData && docData.email) || user.email || "";
  const name = (docData && docData.name) || user.displayName || "";
  const balance = (docData && (docData.balance ?? 0)) ?? 0;
  const avatar = (docData && docData.avatar) || user.photoURL || "https://sarkar-telecom.github.io/Topup/default-avatar.png";

  if($("user-email")) $("user-email").textContent = email;
  if($("user-balance")) $("user-balance").textContent = `💎 ${balance}`;
  if($("user-photo")) $("user-photo").src = avatar;
  if($("auth-btn")) {
    $("auth-btn").textContent = "Logout";
    $("auth-btn").onclick = async () => {
      try { await signOut(auth); location.reload(); } catch(err){ console.error(err); }
    };
  }

  // cache minimal user for other pages
  try {
    localStorage.setItem("user", JSON.stringify({ uid:user.uid, email, name, balance, avatar }));
  } catch(e){}
}

// expose function to let pages query current user data
export async function getCurrentUserData() {
  if(!auth || !db) return null;
  const u = auth.currentUser;
  if(!u) return null;
  try {
    const snap = await getDoc(doc(db, "users", u.uid));
    return { authUser: u, userDoc: snap.exists()? snap.data() : null };
  } catch(e){
    console.error("getCurrentUserData error", e);
    return { authUser: u, userDoc: null };
  }
}

// main: listen auth state and update header UI
if (auth) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setLoggedOutUI();
      return;
    }
    // fetch Firestore users/{uid} if exists
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.exists() ? snap.data() : null;
      setLoggedInUI(user, data);
    } catch(err){
      console.error("Error fetching user doc", err);
      setLoggedInUI(user, null);
    }
  }, (err) => {
    console.error("onAuthStateChanged error", err);
    setLoggedOutUI();
  });
} else {
  // if no auth (init failed), fallback
  setLoggedOutUI();
}

// also export logout for pages
export async function signOutUser(){
  if(!auth) return;
  await signOut(auth);
  try { localStorage.removeItem("user"); } catch(e){}
}