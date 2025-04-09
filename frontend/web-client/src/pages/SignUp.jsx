import React, { useState, useEffect, useRef } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/SignUp.css';

// Components
import GalaxyBackground from "./components/GalaxyBackground";
import FirstNameField from "./components/regis/FristNameField";
import LastNameField from "./components/regis/LastNameField";
import EmailField from "./components/regis/EmailField";
import CheckGender from "./components/regis/CheckGender";
import PasswordFields from "./components/regis/PasswordFields";
import LoginLink from "./components/regis/LoginLink";
import CheckAgree from "./components/regis/CheckAgree";
import RegisButton from "./components/regis/RegisButton";
import ErrorToast from "./components/common/ErrorToast";
import SuccessToast from "./components/common/SuccessToast";

// API URLs
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api/auth";

export default function SignUp() {
  const navigate = useNavigate();
  const otpInputRefs = useRef(Array(6).fill(null).map(() => React.createRef()));

  // Form data state
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    email: "",
    gender: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: true
  });

  // UI state
  const [errorMessages, setErrorMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(true);
  const [otpValues, setOtpValues] = useState(Array(6).fill(''));
  const [userId, setUserId] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [otpResendDisabled, setOtpResendDisabled] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const jwt = localStorage.getItem("jwt_token");
    if (jwt) {
      navigate("/home");
    }
  }, [navigate]);

  // Hide toasts after 5 seconds
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

  useEffect(() => {
    let timer;
    if (showSuccessToast) {
      timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 5000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showSuccessToast]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prevCount => prevCount - 1);
      }, 1000);
    } else {
      setOtpResendDisabled(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown]);

  // Focus on first OTP input when switching to OTP screen
  useEffect(() => {
    if (!isRegistering && otpInputRefs.current[0]?.current) {
      setTimeout(() => {
        otpInputRefs.current[0].current.focus();
      }, 100);
    }
  }, [isRegistering]);

  // Generic handler for all form fields
  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Navigate to login page
  const handleLogin = () => {
    navigate("/signin");
  };

  // Validate registration form
  const validateForm = () => {
    const newErrors = [];

    // Validate firstName
    if (!formData.firstName.trim()) {
      newErrors.push("Vui lòng nhập tên của bạn");
    }

    // Validate lastName
    if (!formData.lastName.trim()) {
      newErrors.push("Vui lòng nhập họ của bạn");
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.push("Vui lòng nhập email của bạn");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.push("Email không hợp lệ");
      }
    }

    // Validate gender
    if (!formData.gender) {
      newErrors.push("Vui lòng chọn giới tính");
    }

    // Validate password
    if (!formData.password) {
      newErrors.push("Vui lòng nhập mật khẩu");
    } else if (formData.password.length < 6) {
      newErrors.push("Mật khẩu phải có ít nhất 6 ký tự");
    }

    // Validate confirmPassword
    if (!formData.confirmPassword) {
      newErrors.push("Vui lòng xác nhận mật khẩu");
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.push("Mật khẩu xác nhận không khớp");
    }

    // Check agree to terms
    if (!formData.agreeToTerms) {
      newErrors.push("Vui lòng đồng ý với điều khoản dịch vụ");
    }

    if (newErrors.length > 0) {
      setErrorMessages(newErrors);
      setShowErrorToast(true);
      return false;
    }

    return true;
  };

  // Handle registration form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // 1. Register with Firebase
      const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
      );

      const user = userCredential.user;
      setUserId(user.uid);

      // 2. Update profile info in Firebase
      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`
      });

      // 3. Register with backend and send OTP
      try {
        // Register user in backend
        await axios.post(`${API_BASE_URL}/signup`, {
          uid: user.uid,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          gender: formData.gender,
          password: formData.password,
          avatarUrl: null
        });

        // Request OTP
        await axios.post(`${API_BASE_URL}/send-otp`, {
          email: formData.email,
          uid: user.uid
        });

        // Switch to OTP verification screen
        setIsRegistering(false);
        setSuccessMessage("Mã xác thực đã được gửi đến email của bạn.");
        setShowSuccessToast(true);

        // Start countdown for OTP resend
        setOtpResendDisabled(true);
        setCountdown(60); // 60 seconds countdown
      } catch (apiError) {
        console.error("API Error:", apiError.response || apiError);
        setErrorMessages([
          "Không thể kết nối đến máy chủ. Vui lòng thử lại sau."
        ]);
        setShowErrorToast(true);
      }
    } catch (err) {
      console.error('Firebase registration error:', err);

      // Handle Firebase errors
      switch (err.code) {
        case "auth/email-already-in-use":
          setErrorMessages(["Email này đã được sử dụng bởi tài khoản khác"]);
          break;
        case "auth/invalid-email":
          setErrorMessages(["Email không hợp lệ"]);
          break;
        case "auth/weak-password":
          setErrorMessages(["Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn"]);
          break;
        case "auth/operation-not-allowed":
          setErrorMessages(["Đăng ký tài khoản hiện không được phép"]);
          break;
        case "auth/network-request-failed":
          setErrorMessages(["Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại"]);
          break;
        default:
          setErrorMessages([`Lỗi đăng ký: ${err.message}`]);
      }

      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    // Allow only numbers
    if (value !== '' && !/^\d+$/.test(value)) {
      return;
    }

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Move to next input if current has value
    if (value !== '' && index < 5) {
      otpInputRefs.current[index + 1].current.focus();
    }
  };

  // Handle keyboard navigation in OTP inputs
  const handleOtpKeyDown = (index, e) => {
    // Move to previous input on backspace if current is empty
    if (e.key === 'Backspace' && otpValues[index] === '' && index > 0) {
      otpInputRefs.current[index - 1].current.focus();
    }
  };

  // Handle OTP paste (allow pasting full 6-digit OTP)
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');

    // Check if pasted content is a 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const newOtpValues = pastedData.split('');
      setOtpValues(newOtpValues);

      // Focus on last input
      otpInputRefs.current[5].current.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    // Combine OTP digits
    const otpCode = otpValues.join('');

    // Validate OTP
    if (otpCode.length !== 6) {
      setErrorMessages(["Vui lòng nhập đủ 6 chữ số mã OTP"]);
      setShowErrorToast(true);
      return;
    }

    try {
      setLoading(true);

      // Send OTP to backend for verification
      const response = await axios.post(`${API_BASE_URL}/verify-otp`, {
        email: formData.email,
        otp: otpCode
      });

      if (response.status === 200) {
        // Successful verification
        setVerificationSuccess(true);
        setSuccessMessage("Xác thực thành công! Đang chuyển hướng đến trang đăng nhập...");
        setShowSuccessToast(true);

        // Save JWT token if returned from backend
        if (response.data.token) {
          localStorage.setItem("jwt_token", response.data.token);
        }

        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate("/signin", { state: { verified: true } });
        }, 3000);
      }
    } catch (err) {
      console.error("OTP verification error:", err.response || err);

      if (err.response && err.response.status === 400) {
        // Invalid OTP error
        setErrorMessages(["Mã OTP không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại"]);
      } else {
        // Other error
        setErrorMessages(["Lỗi xác thực: Không thể kết nối đến máy chủ"]);
      }

      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (otpResendDisabled) return;

    try {
      setLoading(true);
      setOtpResendDisabled(true);

      // Resend OTP
      await axios.post(`${API_BASE_URL}/send-otp`, {
        email: formData.email,
        uid: userId
      });

      setSuccessMessage("Mã xác thực mới đã được gửi đến email của bạn.");
      setShowSuccessToast(true);

      // Reset OTP inputs
      setOtpValues(Array(6).fill(''));
      otpInputRefs.current[0].current.focus();

      // Start countdown for OTP resend
      setCountdown(60); // 60 seconds countdown
    } catch (err) {
      console.error("OTP resend error:", err.response || err);
      setErrorMessages(["Không thể gửi lại mã OTP. Vui lòng thử lại sau."]);
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Close error toast
  const closeErrorToast = () => {
    setShowErrorToast(false);
  };

  // Close success toast
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

              {isRegistering ? (
                  // Registration form
                  <>
                    <span className="text-dangki">Hãy đăng ký người dùng để trải nghiệm Loopup</span>

                    <LastNameField
                        lastName={formData.lastName}
                        setlastName={(value) => handleChange('lastName', value)}
                    />
                    <FirstNameField
                        fisrtName={formData.firstName}
                        setfisrtName={(value) => handleChange('firstName', value)}
                    />
                    <EmailField
                        email={formData.email}
                        setEmail={(value) => handleChange('email', value)}
                    />
                    <CheckGender
                        gender={formData.gender}
                        onChange={(value) => handleChange('gender', value)}
                    />
                    <PasswordFields
                        password={formData.password}
                        confirmPassword={formData.confirmPassword}
                        onChange={handleChange}
                    />
                    <CheckAgree
                        checked={formData.agreeToTerms}
                        onChange={(value) => handleChange('agreeToTerms', value)}
                    />
                    <LoginLink onClick={handleLogin} />
                    <RegisButton
                        onClick={handleSubmit}
                        loading={loading}
                        disabled={loading}
                        text={loading ? "Đang xử lý..." : "Đăng ký"}
                    />
                  </>
              ) : (
                  // OTP verification form
                  <div className="otp-verification">
                    <span className="text-dangki">Xác thực tài khoản</span>

                    {verificationSuccess ? (
                        <div className="success-message">
                          <div className="success-icon">✓</div>
                          <p>{successMessage}</p>
                        </div>
                    ) : (
                        <>
                          <div className="verification-info">
                            <p>Mã xác thực đã được gửi đến email:</p>
                            <p className="email-highlight">{formData.email}</p>
                            <p>Vui lòng kiểm tra hộp thư đến và nhập mã 6 số dưới đây.</p>
                          </div>

                          <div className="otp-input-container">
                            {otpValues.map((value, index) => (
                                <input
                                    key={index}
                                    ref={otpInputRefs.current[index]}
                                    type="text"
                                    className="otp-input"
                                    value={value}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    onPaste={index === 0 ? handleOtpPaste : null}
                                    maxLength={1}
                                    autoComplete="off"
                                />
                            ))}
                          </div>

                          <div className="verification-actions">
                            <button
                                className="verify-button"
                                onClick={handleVerifyOtp}
                                disabled={loading}
                            >
                              {loading ? "Đang xử lý..." : "Xác thực"}
                            </button>

                            <div className="resend-container">
                              <span>Không nhận được mã? </span>
                              {countdown > 0 ? (
                                  <span className="countdown">Gửi lại sau {countdown}s</span>
                              ) : (
                                  <button
                                      className="resend-button"
                                      onClick={handleResendOtp}
                                      disabled={otpResendDisabled || loading}
                                  >
                                    Gửi lại
                                  </button>
                              )}
                            </div>
                          </div>
                        </>
                    )}
                  </div>
              )}
            </div>
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