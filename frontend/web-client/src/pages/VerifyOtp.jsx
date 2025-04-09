import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import GalaxyBackground from './components/GalaxyBackground';
import ErrorToast from './components/common/ErrorToast';
import SuccessToast from './components/common/SuccessToast';
import '../styles/VerifyOtp.css';

// API URLs
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api/auth";

export default function VerifyOtp() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [uid, setUid] = useState('');
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [errorMessages, setErrorMessages] = useState([]);
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [otpResendDisabled, setOtpResendDisabled] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState(false);

    // OTP input refs
    const otpInputRefs = useRef(Array(6).fill(null).map(() => React.createRef()));

    // Get email and uid from location state
    useEffect(() => {
        if (location.state?.email && location.state?.uid) {
            setEmail(location.state.email);
            setUid(location.state.uid);

            // Send OTP automatically when component loads
            if (!location.state?.otpSent) {
                sendOtp(location.state.email, location.state.uid);
            }
        } else {
            // Redirect to login if no email/uid provided
            navigate('/signin');
        }
    }, [location, navigate]);

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

    // Focus on first OTP input when component loads
    useEffect(() => {
        if (otpInputRefs.current[0]?.current) {
            setTimeout(() => {
                otpInputRefs.current[0].current.focus();
            }, 100);
        }
    }, []);

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

    // Send OTP to user's email
    const sendOtp = async (userEmail, userId) => {
        try {
            setLoading(true);
            setOtpResendDisabled(true);

            // Request OTP from backend
            await axios.post(`${API_BASE_URL}/send-otp`, {
                email: userEmail,
                uid: userId
            });

            // Start countdown for OTP resend
            setCountdown(60); // 60 seconds countdown

            // Show success message
            setSuccessMessage("Mã xác thực đã được gửi đến email của bạn.");
            setShowSuccessToast(true);

            // Reset OTP inputs
            setOtpValues(Array(6).fill(''));
            if (otpInputRefs.current[0]?.current) {
                otpInputRefs.current[0].current.focus();
            }
        } catch (err) {
            console.error("OTP send error:", err.response || err);
            setErrorMessages(["Không thể gửi mã OTP. Vui lòng thử lại sau."]);
            setShowErrorToast(true);
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOtp = () => {
        if (otpResendDisabled) return;
        sendOtp(email, uid);
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
                email: email,
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
                        <span className="text-otp">Xác thực tài khoản</span>

                        {verificationSuccess ? (
                            <div className="verification-success">
                                <div className="success-icon">✓</div>
                                <p>{successMessage}</p>
                            </div>
                        ) : (
                            <div className="otp-verification">
                                <div className="verification-info">
                                    <p>Mã xác thực đã được gửi đến email:</p>
                                    <p className="email-highlight">{email}</p>
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
                                            disabled={loading || verificationSuccess}
                                        />
                                    ))}
                                </div>

                                <div className="verification-actions">
                                    <button
                                        className="verify-button"
                                        onClick={handleVerifyOtp}
                                        disabled={loading || verificationSuccess}
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
                                                disabled={otpResendDisabled || loading || verificationSuccess}
                                            >
                                                Gửi lại
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="back-to-login">
                                    <button
                                        className="back-button"
                                        onClick={() => navigate('/signin')}
                                        disabled={loading || verificationSuccess}
                                    >
                                        Quay lại đăng nhập
                                    </button>
                                </div>
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