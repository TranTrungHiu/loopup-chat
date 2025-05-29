import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB7ZXmo9BfjsJb6EpWigMgq3wgP6uT7CwI",
  authDomain: "loopupchat-7d5dc.firebaseapp.com",
  projectId: "loopupchat-7d5dc",
  storageBucket: "loopupchat-7d5dc.firebasestorage.app",
  messagingSenderId: "836779038018",
  appId: "1:836779038018:web:f232dbd1f9eee52ebde4db",
  measurementId: "G-F4R0Q84K8H"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);