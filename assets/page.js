import { auth, db } from "./app.js";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const path = location.pathname.split('/').pop() || "index.html";

// --- Login Page ---
if (path === "login.html") {
  const form = document.getElementById("loginForm");
  form?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const pass = document.getElementById("loginPassword").value;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      location.href = "dashboard.html";
    } catch (err) {
      alert("❌ Login failed: " + err.message);
    }
  });
}

// --- Signup Page ---
if (path === "signup.html") {
  const form = document.getElementById("signupForm");
  form?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const pass = document.getElementById("signupPassword").value;
    const phone = document.getElementById("signupPhone").value.trim();

    try {
      // Firebase Auth এ নতুন ইউজার তৈরি
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      // Display Name update
      await updateProfile(cred.user, { displayName: name });

      // Firestore এ ডকুমেন্ট তৈরি
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name,
        email,
        phone,
        balance: 0,
        role: "user",
        status: "pending",
        createdAt: serverTimestamp()
      });

      alert("✅ Account created successfully!");
      location.href = "dashboard.html";
    } catch (err) {
      alert("❌ Signup failed: " + err.message);
    }
  });
}