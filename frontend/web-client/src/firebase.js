import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAn3jRBAFQfSxQIEEXC4IlhHrllndSlXN0",
    authDomain: "loopup-chat-ff5d8.firebaseapp.com",
    projectId: "loopup-chat-ff5d8",
    storageBucket: "loopup-chat-ff5d8.firebasestorage.app",
    messagingSenderId: "841788421022",
    appId: "1:841788421022:web:0c717ba40af1f66ad61c8f",
    measurementId: "G-TQR60KFLZP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);