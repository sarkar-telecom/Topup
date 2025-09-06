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

// --- Signup ---
if (path === "signup.html") {
  const form = document.getElementById("signupForm");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const pass = document.getElementById("signupPassword").value;
    const phone = document.getElementById("signupPhone").value.trim();

    try {
      // Auth user তৈরি
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      // Display name update
      await updateProfile(cred.user, { displayName: name });

      // Firestore এ ইউজার ডকুমেন্ট সেভ
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
      console.error(err);
      alert("❌ Signup error: " + err.message);
    }
  });
}