import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBIP6tmOAADrQixIkWWPgLoJZZuj8Y4yOc",
  authDomain: "loopup-2126c.firebaseapp.com",
  projectId: "loopup-2126c",
  storageBucket: "loopup-2126c.firebasestorage.app",
  messagingSenderId: "1032067116179",
  appId: "1:1032067116179:web:c73549ed13aae079a0b166",
  measurementId: "G-D35V67HST0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);