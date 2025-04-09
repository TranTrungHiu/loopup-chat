import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/SignIn.css";

// Components
import GalaxyBackground from "./components/GalaxyBackground";
import EmailInput from "./components/auth/EmailInput";
import PasswordInput from "./components/auth/PasswordInput";
import LoginButton from "./components/auth/button";
import SocialLoginOptions from "./components/auth/SocialLoginOptions";
import ForgotPassword from "./components/auth/ForgotPassword";
import RememberPassword from "./components/auth/RememberPassword";
import RegisterLink from "./components/auth/RegisterLink";
import ErrorToast from "./components/common/ErrorToast";
import SuccessToast from "./components/common/SuccessToast";

// API URLs
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api/auth";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [errorMessages, setErrorMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Check if already logged in
  useEffect(() => {
    const jwt = localStorage.getItem("jwt_token");
    if (jwt) {
      navigate("/home");
    }

    // Check if coming from verification page
    if (location.state?.verified) {
      setSuccessMessage("Email đã được xác thực. Vui lòng đăng nhập.");
      setShowSuccessToast(true);
    }
  }, [navigate, location]);

  // Handle error toast
  useEffect(() => {
    let timer;
    if (showErrorToast && errorMessages.length > 0) {
      timer = setTimeout(() => {
        setShowErrorToast(false);
      }, 5000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showErrorToast, errorMessages]);

  // Handle success toast
  useEffect(() => {
    let timer;
    if (showSuccessToast) {
      timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showSuccessToast]);

  // Set email from localStorage if "remember me" was checked previously
  useEffect(() => {
    const savedEmail = localStorage.getItem("remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleRegister = () => {
    navigate("/signup");
  };

  const handleForgotPass = () => {
    navigate("/forgot");
  };

  const handleRememberMe = (checked) => {
    setRememberMe(checked);
  };

  const handleSignIn = async () => {
    // Reset previous messages
    setErrorMessages([]);
    setSuccessMessage("");

    // Validate input
    if (!email.trim()) {
      setErrorMessages(["Vui lòng nhập email"]);
      setShowErrorToast(true);
      return;
    }

    if (!pass.trim()) {
      setErrorMessages(["Vui lòng nhập mật khẩu"]);
      setShowErrorToast(true);
      return;
    }

    try {
      setLoading(true);

      // 1. Sign in with Firebase
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseToken = await userCred.user.getIdToken();

      // 2. Save Firebase info to localStorage
      localStorage.setItem("firebase_token", firebaseToken);
      localStorage.setItem("uid", userCred.user.uid);
      localStorage.setItem("email", userCred.user.email);

      // Save email to localStorage if "remember me" is checked
      if (rememberMe) {
        localStorage.setItem("remember_email", email);
      } else {
        localStorage.removeItem("remember_email");
      }

      // 3. Send token to backend to get JWT
      try {
        const response = await axios.post(`${API_BASE_URL}/login`, {
          idToken: firebaseToken
        });

        if (response.status === 200) {
          // Save JWT from backend
          if (response.data.token) {
            localStorage.setItem("jwt_token", response.data.token);
          }

          // Save user profile data if available
          if (response.data.user) {
            localStorage.setItem("user_profile", JSON.stringify(response.data.user));
          }

          // Check account verification
          if (response.data.verified === false) {
            // Redirect to OTP verification page if account is not verified
            setErrorMessages(["Tài khoản chưa được xác thực. Vui lòng xác thực email."]);
            setShowErrorToast(true);

            // Redirect to OTP verification page
            setTimeout(() => {
              navigate("/verify-otp", {
                state: { email: email, uid: userCred.user.uid }
              });
            }, 2000);
            return;
          }

          // Successful login
          setSuccessMessage("Đăng nhập thành công!");
          setShowSuccessToast(true);

          // Redirect to home page after 1 second
          setTimeout(() => {
            navigate("/home");
          }, 1000);
        }
      } catch (apiError) {
        console.error("Backend authentication error:", apiError.response || apiError);

        if (apiError.response && apiError.response.status === 401) {
          // Account not verified
          setErrorMessages(["Tài khoản chưa được xác thực. Vui lòng xác thực email."]);
          setTimeout(() => {
            navigate("/verify-otp", {
              state: { email: email, uid: userCred.user.uid }
            });
          }, 2000);
        } else {
          setErrorMessages(["Không thể kết nối đến máy chủ. Đăng nhập với xác thực cơ bản."]);
          setTimeout(() => navigate("/home"), 1000);
        }
      }
    } catch (err) {
      console.error("Firebase auth error:", err);

      // Handle Firebase errors
      switch (err.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
          setErrorMessages(["Email hoặc mật khẩu không đúng"]);
          break;
        case "auth/user-not-found":
          setErrorMessages(["Tài khoản không tồn tại"]);
          break;
        case "auth/invalid-email":
          setErrorMessages(["Email không hợp lệ"]);
          break;
        case "auth/too-many-requests":
          setErrorMessages(["Quá nhiều lần thử đăng nhập không thành công. Vui lòng thử lại sau"]);
          break;
        case "auth/user-disabled":
          setErrorMessages(["Tài khoản đã bị vô hiệu hóa"]);
          break;
        default:
          setErrorMessages([`Đăng nhập thất bại: ${err.message}`]);
      }

      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle enter key press in password field
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSignIn();
    }
  };

  const closeErrorToast = () => {
    setShowErrorToast(false);
  };

  const closeSuccessToast = () => {
    setShowSuccessToast(false);
  };

  return (
      <GalaxyBackground>
        <div className="main-container">
          <div className="wrapper">
            <div className="img" />
          </div>
          <div className="box" />
          <div className="box-2">
            <div className="section">
              <div className="img-2" />
              <span className="text-wellcome">vui lòng đăng nhập để tiếp tục</span>

              {/* Email input component */}
              <EmailInput email={email} setEmail={setEmail} />

              {/* Password input component */}
              <PasswordInput
                  password={pass}
                  setPassword={setPass}
                  onKeyPress={handleKeyPress}
              />

              {/* Remember password checkbox */}
              <RememberPassword
                  checked={rememberMe}
                  onChange={handleRememberMe}
              />

              {/* Forgot password link */}
              <ForgotPassword onclick={handleForgotPass} />

              {/* Login button */}
              <LoginButton
                  onClick={handleSignIn}
                  disabled={loading}
                  text={loading ? "Đang xử lý..." : "Đăng nhập"}
              />

              <span className="titile">hoặc đăng nhập với</span>

              {/* Social login options */}
              <SocialLoginOptions />
            </div>

            {/* Register link */}
            <RegisterLink onClick={handleRegister} />
          </div>

          <span className="text-d">Loopup xin chào</span>

          {/* Error Toast Component */}
          {showErrorToast && errorMessages.length > 0 && (
              <ErrorToast
                  messages={errorMessages}
                  onClose={closeErrorToast}
              />
          )}

          {/* Success Toast Component */}
          {showSuccessToast && successMessage && (
              <SuccessToast
                  message={successMessage}
                  onClose={closeSuccessToast}
              />
          )}
        </div>
      </GalaxyBackground>
  );
}