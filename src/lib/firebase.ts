import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkj2SU1iePLNKBjAtrTm3VV8upURbc1qU",
  authDomain: "lawlawii.firebaseapp.com",
  projectId: "lawlawii",
  storageBucket: "lawlawii.firebasestorage.app",
  messagingSenderId: "1081860335010",
  appId: "1:1081860335010:web:94fb41f75c7a2641bb7efb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
