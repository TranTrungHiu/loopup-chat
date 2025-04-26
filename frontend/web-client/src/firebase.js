import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAJ1uHhSbuLPzZ1TLfpN9yW7M3E8bOum-c",
  authDomain: "loopupchat-b5418.firebaseapp.com",
  projectId: "loopupchat-b5418",
  storageBucket: "loopupchat-b5418.firebasestorage.app",
  messagingSenderId: "1020172851210",
  appId: "1:1020172851210:web:95a09913bc26a9b7c127f3",
  measurementId: "G-QVXL7TZ49T"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);