
# Diamond Recharge — Firebase Web (Static)

This build is ready to deploy on any static host (GitHub Pages, Netlify, Vercel).

## Features
- Email/Password Auth (Firebase)
- User profiles in `users` collection
- Place orders (`orders` collection) with status flow: WAITING → APPROVED/CANCELLED
- Auto-cancel WAITING orders older than 5 minutes (client-side sweep on page load for user; global sweep on admin page load)
- Admin panel to activate/block users and adjust balance
- Dark, mobile-friendly UI with sidebar

## Setup
1. In Firebase console, enable **Authentication → Email/Password**.
2. Create **Cloud Firestore** (Production mode).  
3. (Optional) Add yourself as admin: in `users/{yourUid}` set `role: "admin"` and `status: "active"`.

## Basic Rules (example — tighten before production)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isAdmin() { return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin"; }

    match /users/{uid} {
      allow read: if isSignedIn() && request.auth.uid == uid || isAdmin();
      allow write: if request.auth.uid == uid || isAdmin();
    }

    match /orders/{id} {
      allow create: if isSignedIn();
      allow read: if isSignedIn() && (resource.data.uid == request.auth.uid || isAdmin());
      allow update, delete: if isAdmin() || (isSignedIn() && resource.data.uid == request.auth.uid);
    }
  }
}
```
> Adjust rules for your needs before production.
