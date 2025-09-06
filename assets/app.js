// Firebase init (user config)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, addDoc, getDocs, onSnapshot, collection, query, where, orderBy, serverTimestamp, Timestamp, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDJRm9-jRkxVrTLYBzK1gGrRmAEu29jVrU",
  authDomain: "diamond-recharge-f7f59.firebaseapp.com",
  projectId: "diamond-recharge-f7f59",
  storageBucket: "diamond-recharge-f7f59.firebasestorage.app",
  messagingSenderId: "657717928489",
  appId: "1:657717928489:web:70431ebc9afb7002d4b238",
  measurementId: "G-TDK78BQ8SQ"
};
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Sidebar controls
const openBtn = document.getElementById("openSidebar");
const closeBtn = document.getElementById("closeSidebar");
const sidebar = document.getElementById("sidebar");
if (openBtn) openBtn.onclick = () => sidebar.style.width = "260px";
if (closeBtn) closeBtn.onclick = () => sidebar.style.width = "0";

// Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) logoutBtn.onclick = async () => { await signOut(auth); location.href = "login.html"; };

// Ensure user document exists
export async function ensureUserDoc(user) {
  const uref = doc(db, "users", user.uid);
  const snap = await getDoc(uref);
  if (!snap.exists()) {
    await setDoc(uref, {
      uid: user.uid,
      email: user.email,
      name: user.displayName || "",
      status: "pending", // pending | active | blocked
      balance: 0,
      createdAt: serverTimestamp(),
      role: "user"
    });
  }
}

// Guard pages
export function requireAuth(redirect = "login.html") {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!location.pathname.endsWith("login.html") && !location.pathname.endsWith("signup.html")) location.href = redirect;
        resolve(null);
        return;
      }
      await ensureUserDoc(user);
      resolve(user);
    });
  });
}

// Helpers
export const fmt = (n)=> new Intl.NumberFormat("en-IN").format(n||0);
export const timeAgo = (ts)=> {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now()-d.getTime())/1000;
  if (diff<60) return `${Math.floor(diff)}s ago`;
  if (diff<3600) return `${Math.floor(diff/60)}m ago`;
  if (diff<86400) return `${Math.floor(diff/3600)}h ago`;
  return d.toLocaleString();
}

// Auto-cancel ANY waiting orders older than 5 minutes (user-scoped + admin-scoped)
export async function autoCancelStaleOrders(scope="user", uid=null) {
  const fiveMinAgo = Timestamp.fromMillis(Date.now() - 5*60*1000);
  let q;
  if (scope==="user" && uid) {
    q = query(collection(db,"orders"), where("uid","==",uid), where("status","==","WAITING"), where("createdAt","<", fiveMinAgo), limit(50));
  } else {
    q = query(collection(db,"orders"), where("status","==","WAITING"), where("createdAt","<", fiveMinAgo), limit(100));
  }
  const snaps = await getDocs(q);
  const updates = [];
  for (const docSnap of snaps.docs) {
    updates.push(updateDoc(doc(db,"orders",docSnap.id), { status:"CANCELLED", cancelledAt: serverTimestamp(), cancelReason: "Auto-cancel after 5 min" }));
  }
  await Promise.all(updates);
  return updates.length;
}
