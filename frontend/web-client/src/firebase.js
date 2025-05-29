import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBZCO41OfNLBWF_63zGQbk2t4CY_syrQGw",
  authDomain: "loopup-chat-dca0e.firebaseapp.com",
  projectId: "loopup-chat-dca0e",
  storageBucket: "loopup-chat-dca0e.firebasestorage.app",
  messagingSenderId: "864739989546",
  appId: "1:864739989546:web:ec12c00d8f8feac4084b53",
  measurementId: "G-B6TJL6JYQZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);