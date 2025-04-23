import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCOZVQCeNScMe7U1K03WTqPHYpAYW7D_-s",
  authDomain: "loopupchat.firebaseapp.com",
  projectId: "loopupchat",
  storageBucket: "loopupchat.firebasestorage.app",
  messagingSenderId: "1017742595061",
  appId: "1:1017742595061:web:f130c334d9c60d4138c6bc",
  measurementId: "G-FYEHBGGRRZ"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
