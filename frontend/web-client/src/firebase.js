import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAV-OvLPWBeJ5BaHXPVKXQrK5u6wJkzmjw",
  authDomain: "loopup-chat-9b825.firebaseapp.com",
  projectId: "loopup-chat-9b825",
  storageBucket: "loopup-chat-9b825.firebasestorage.app",
  messagingSenderId: "958587571939",
  appId: "1:958587571939:web:92b4ac2bf5203a62c37fd6",
  measurementId: "G-51X3LKWKJN"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);