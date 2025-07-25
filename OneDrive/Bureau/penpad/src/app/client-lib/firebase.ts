import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyDy4TBz1GLRpdouGR7sq5SJHNfTRy6mc7g",
  authDomain: "pennpad-9e47b.firebaseapp.com",
  projectId: "pennpad-9e47b",
  storageBucket: "pennpad-9e47b.appspot.com",
  messagingSenderId: "62306169142",
  appId: "1:62306169142:web:366619a9dc108f9d0c4397",
  measurementId: "G-Q894RJ1MMK"
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()
const db = getFirestore(app)
const storage = getStorage(app)

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    // Ignore if it's already enabled or not supported
    if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
      console.error('Firestore persistence error:', err);
    }
  });
}

export { app, auth, googleProvider, db, storage }
export default app 