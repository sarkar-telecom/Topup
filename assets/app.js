// For Firebase v10+
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

// Ensure user doc
export async function ensureUserDoc(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      name: user.displayName || "",
      balance: 0,
      role: "user",
      status: "active",
      createdAt: serverTimestamp()
    });
  }
}

// Auth guard
export function requireAuth(redirect="login.html") {
  return new Promise(resolve=>{
    onAuthStateChanged(auth, async user=>{
      if(!user){
        if(!location.pathname.endsWith("login.html") && !location.pathname.endsWith("signup.html")){
          location.href=redirect;
        }
        resolve(null);
      }else{
        await ensureUserDoc(user);
        resolve(user);
      }
    });
  });
}

// Helpers
export const fmt = (n)=> new Intl.NumberFormat().format(n||0);
export const timeAgo = (ts)=>{
  if(!ts) return "-";
  const d = ts.toDate? ts.toDate(): new Date(ts);
  const diff=(Date.now()-d.getTime())/1000;
  if(diff<60) return Math.floor(diff)+"s ago";
  if(diff<3600) return Math.floor(diff/60)+"m ago";
  if(diff<86400) return Math.floor(diff/3600)+"h ago";
  return d.toLocaleString();
};