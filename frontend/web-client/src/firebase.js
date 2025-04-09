// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile,
    onAuthStateChanged
} from "firebase/auth";

// Firebase configuration - thay thế bằng thông tin cấu hình của bạn
const firebaseConfig = {
    apiKey: "AIzaSyCh9WoPrbKUodGifh79I8m4nWu7hoifz1Y",
    authDomain: "loopup-chat.firebaseapp.com",
    projectId: "loopup-chat",
    storageBucket: "loopup-chat.firebasestorage.app",
    messagingSenderId: "409130217307",
    appId: "1:409130217307:web:647ac257832a1dfc63347e",
    measurementId: "G-RM53E7KP90"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Đăng ký người dùng mới
export const registerWithEmailAndPassword = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Gửi email xác thực
        await sendEmailVerification(userCredential.user);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

// Đăng nhập với email và password
export const loginWithEmailAndPassword = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

// Đăng xuất
export const logoutUser = async () => {
    try {
        await signOut(auth);
        return true;
    } catch (error) {
        throw error;
    }
};

// Gửi email reset mật khẩu
export const sendPasswordReset = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return true;
    } catch (error) {
        throw error;
    }
};

// Cập nhật profile người dùng
export const updateUserProfile = async (displayName, photoURL) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No user logged in");

        await updateProfile(user, {
            displayName,
            photoURL
        });

        return user;
    } catch (error) {
        throw error;
    }
};

// Lấy token ID hiện tại
export const getIdToken = async () => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No user logged in");

        const token = await user.getIdToken(true);
        return token;
    } catch (error) {
        throw error;
    }
};

// Theo dõi trạng thái đăng nhập
export const onAuthStateChangedListener = (callback) => {
    return onAuthStateChanged(auth, callback);
};
export const testFirebaseConnection = () => {
    try {
        console.log("Firebase Auth hiện tại:", auth);
        console.log("Firebase App hiện tại:", auth.app);
        return {
            success: true,
            message: "Kết nối Firebase thành công",
            config: auth.app.options
        };
    } catch (error) {
        return {
            success: false,
            message: "Lỗi kết nối Firebase",
            error: error.message
        };
    }
};

export { auth };