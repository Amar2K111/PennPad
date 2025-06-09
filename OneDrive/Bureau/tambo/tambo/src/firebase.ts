import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBjNjNh9KKp3dZEjziVWURKrDgW1PX-VbM",
  authDomain: "tambo-947b3.firebaseapp.com",
  projectId: "tambo-947b3",
  storageBucket: "tambo-947b3.firebasestorage.app",
  messagingSenderId: "224591625264",
  appId: "1:224591625264:web:521346942332d78fa901f5",
  measurementId: "G-213RQQ9M92"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider }; 