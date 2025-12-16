import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBKOfrSFWZw4bAXs9_d887JFex_YX9g3Fg",
  authDomain: "yuhwapainting.firebaseapp.com",
  projectId: "yuhwapainting",
  storageBucket: "yuhwapainting.firebasestorage.app",
  messagingSenderId: "587819388000",
  appId: "1:587819388000:web:2ae9cfd5e73be6ec634705"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 🔐 인증 (Google 로그인)
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 🗄️ Firestore DB
export const db = getFirestore(app);
