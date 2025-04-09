import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCh9WoPrbKUodGifh79I8m4nWu7hoifz1Y",
  authDomain: "loopup-chat.firebaseapp.com",
  projectId: "loopup-chat",
 storageBucket: "loopup-chat.appspot.com",
  messagingSenderId: "409130217307",
  appId: "1:409130217307:web:647ac257832a1dfc63347e",
  measurementId: "G-RM53E7KP90"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
