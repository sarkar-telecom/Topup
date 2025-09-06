import { auth, db, requireAuth, ensureUserDoc, fmt, timeAgo, autoCancelStaleOrders } from "./app.js";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, where, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const path = location.pathname.split('/').pop() || "index.html";

// ================= LOGIN =================
if (path === "login.html") {
  const form = document.getElementById("loginForm");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const pass = document.getElementById("loginPassword").value;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      location.href = "dashboard.html";
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  });
}

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
      // Firebase Auth এ ইউজার তৈরি
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      // Display Name আপডেট
      await updateProfile(cred.user, { displayName: name });

      // Firestore এ ডকুমেন্ট তৈরি (অতিরিক্ত ফিল্ড সহ)
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name: name,
        email: email,
        phone: phone,
        balance: 0,
        role: "user",
        status: "pending",
        createdAt: serverTimestamp()
      });

      alert("✅ Account created successfully!");
      location.href = "dashboard.html";
    } catch (err) {
      alert("❌ Signup error: " + err.message);
    }
  });
}

// ================= DASHBOARD =================
if (path === "dashboard.html") {
  (async () => {
    const user = await requireAuth();
    if (!user) return;
    autoCancelStaleOrders("user", user.uid).catch(() => {});

    const uref = doc(db, "users", user.uid);
    const usnap = await getDoc(uref);
    const u = usnap.data();

    document.getElementById("balanceAmount").textContent = "৳ " + fmt(u.balance || 0);
    document.getElementById("userStatus").textContent = "status: " + (u.status || "pending");

    const weekAgo = Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const q1 = query(collection(db, "orders"), where("uid", "==", user.uid), where("createdAt", ">", weekAgo));
    const snaps = await getDocs(q1);
    document.getElementById("weeklyOrders").textContent = snaps.size;
  })();
}

// ================= PLACE ORDER =================
if (path === "order.html") {
  (async () => {
    const user = await requireAuth();
    if (!user) return;
    autoCancelStaleOrders("user", user.uid).catch(() => {});

    const form = document.getElementById("orderForm");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const gameId = document.getElementById("gameId").value.trim();
      const diamonds = parseInt(document.getElementById("diamonds").value, 10);
      const note = document.getElementById("note").value.trim();
      if (!gameId || !diamonds || diamonds <= 0) return alert("Enter valid details");

      try {
        await addDoc(collection(db, "orders"), {
          uid: user.uid,
          email: user.email,
          gameId,
          diamonds,
          note,
          status: "WAITING",
          createdAt: serverTimestamp()
        });
        alert("Order placed!");
        location.href = "order-history.html";
      } catch (err) {
        alert("Order error: " + err.message);
      }
    });
  })();
}

// ================= ORDER HISTORY =================
if (path === "order-history.html") {
  (async () => {
    const user = await requireAuth();
    if (!user) return;
    autoCancelStaleOrders("user", user.uid).catch(() => {});

    const tbody = document.querySelector("#ordersTable tbody");
    const q1 = query(collection(db, "orders"), where("uid", "==", user.uid), orderBy("createdAt", "desc"));
    onSnapshot(q1, (snap) => {
      tbody.innerHTML = "";
      snap.forEach((d) => {
        const o = d.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${d.id.slice(0, 6)}..</td>
          <td>${o.diamonds}</td>
          <td><span class="tag">${o.status}</span></td>
          <td>${timeAgo(o.createdAt)}</td>`;
        tbody.appendChild(tr);
      });
    });
  })();
}

// ================= PROFILE =================
if (path === "profile.html") {
  (async () => {
    const user = await requireAuth();
    if (!user) return;
    const uref = doc(db, "users", user.uid);
    const usnap = await getDoc(uref);
    const u = usnap.data();
    document.getElementById("profileName").value = u.name || user.displayName || "";
    document.getElementById("profileEmail").value = user.email;
    document.getElementById("profileForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("profileName").value.trim();
      await updateDoc(uref, { name });
      alert("Profile saved");
    });
  })();
}

// ================= ADMIN =================
if (path === "admin.html") {
  (async () => {
    const user = await requireAuth();
    if (!user) return;

    const uref = doc(db, "users", user.uid);
    const u = (await getDoc(uref)).data();
    if (u?.role !== "admin") {
      alert("Admins only");
      location.href = "dashboard.html";
      return;
    }

    autoCancelStaleOrders("admin").catch(() => {});

    // Users table
    const usersBody = document.querySelector("#usersTable tbody");
    const usersSnap = await getDocs(collection(db, "users"));
    usersBody.innerHTML = "";
    usersSnap.forEach((s) => {
      const u = s.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${u.email || ""}</td>
        <td>${u.name || ""}</td>
        <td><span class="tag">${u.status || "pending"}</span></td>
        <td>৳ ${fmt(u.balance || 0)}</td>
        <td>
          <button class="btn small ok" data-act="activate" data-id="${s.id}">Activate</button>
          <button class="btn small" data-act="block" data-id="${s.id}">Block</button>
          <button class="btn small" data-act="addbal" data-id="${s.id}">+100</button>
          <button class="btn small danger" data-act="subbal" data-id="${s.id}">-100</button>
        </td>`;
      usersBody.appendChild(tr);
    });

    usersBody.addEventListener("click", async (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      const id = t.getAttribute("data-id");
      const act = t.getAttribute("data-act");
      if (!id || !act) return;
      const ref = doc(db, "users", id);
      if (act === "activate") await updateDoc(ref, { status: "active" });
      if (act === "block") await updateDoc(ref, { status: "blocked" });
      if (act === "addbal") await updateDoc(ref, { balance: (await getDoc(ref)).data().balance + 100 });
      if (act === "subbal") await updateDoc(ref, { balance: Math.max(0, (await getDoc(ref)).data().balance - 100) });
    });

    // Orders table
    const ordersBody = document.querySelector("#adminOrdersTable tbody");
    const qAll = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    onSnapshot(qAll, (snap) => {
      ordersBody.innerHTML = "";
      snap.forEach((d) => {
        const o = d.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${o.email || o.uid}</td>
          <td>${o.gameId}</td>
          <td>${o.diamonds}</td>
          <td><span class="tag">${o.status}</span></td>
          <td>${timeAgo(o.createdAt)}</td>
          <td>
            <button class="btn small ok" data-act="approve" data-id="${d.id}">Approve</button>
            <button class="btn small danger" data-act="cancel" data-id="${d.id}">Cancel</button>
          </td>`;
        ordersBody.appendChild(tr);
      });
    });

    ordersBody.addEventListener("click", async (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      const id = t.getAttribute("data-id");
      const act = t.getAttribute("data-act");
      if (!id || !act) return;
      const ref = doc(db, "orders", id);
      if (act === "approve") await updateDoc(ref, { status: "APPROVED", approvedAt: serverTimestamp() });
      if (act === "cancel") await updateDoc(ref, { status: "CANCELLED", cancelledAt: serverTimestamp(), cancelReason: "manual" });
    });
  })();
}