import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import GalaxyBackground from "./components/GalaxyBackground";
import ErrorToast from "./components/common/ErrorToast";
import "../styles/OTP.css";

// API URLs
const API_BASE_URL = "http://localhost:8080/api/auth";

export default function OTPVerificationPage() {
    const [otp, setOtp] = useState("");
    const [errorMessages, setErrorMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [countdown, setCountdown] = useState(120); // 2 phút đếm ngược
    const [isResending, setIsResending] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { email, uid } = location.state || {};

    // Kiểm tra nếu có thông tin email và uid
    useEffect(() => {
        if (!email || !uid) {
            navigate("/signin");
        }
    }, [email, uid, navigate]);

    // Xử lý đếm ngược
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [countdown]);

    // Xử lý toast error
    useEffect(() => {
        let timer;
        if (showToast && errorMessages.length > 0) {
            timer = setTimeout(() => {
                setShowToast(false);
            }, 5000);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [showToast, errorMessages]);

    const validateOtp = () => {
        if (!otp.trim()) {
            setErrorMessages(["Vui lòng nhập mã OTP"]);
            setShowToast(true);
            return false;
        }

        if (otp.length !== 6 || !/^\d+$/.test(otp)) {
            setErrorMessages(["Mã OTP không hợp lệ. Vui lòng nhập 6 chữ số"]);
            setShowToast(true);
            return false;
        }

        return true;
    };

    const handleVerifyOtp = async () => {
        if (!validateOtp()) {
            return;
        }

        try {
            setLoading(true);

            // Gửi OTP đến backend để xác thực
            const response = await axios.post(`${API_BASE_URL}/verify-otp`, {
                email: email,
                otp: otp
            });

            if (response.status === 200) {
                // Xác thực thành công
                setSuccessMessage("Xác thực thành công! Đang chuyển hướng đến trang đăng nhập...");

                // Nếu backend trả về JWT, lưu vào localStorage
                if (response.data.token) {
                    localStorage.setItem("jwt_token", response.data.token);
                }

                // Cập nhật trạng thái xác thực
                try {
                    await axios.post(`${API_BASE_URL}/update-verification`, {
                        uid: uid,
                        verified: true
                    });
                } catch (updateError) {
                    console.log("Không thể cập nhật trạng thái xác thực:", updateError);
                }

                // Chuyển hướng đến trang đăng nhập sau 3 giây
                setTimeout(() => {
                    navigate("/signin");
                }, 3000);
            }
        } catch (err) {
            console.error("Lỗi xác thực OTP:", err.response || err);

            if (err.response && err.response.status === 400) {
                // Lỗi OTP không hợp lệ
                setErrorMessages(["Mã OTP không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại"]);
            } else {
                // Lỗi khác
                setErrorMessages(["Lỗi xác thực: Không thể kết nối đến máy chủ"]);
            }

            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (countdown > 0 && !isResending) {
            return; // Chưa hết thời gian đợi
        }

        try {
            setIsResending(true);

            // Gửi lại OTP
            await axios.post(`${API_BASE_URL}/send-otp`, {
                email: email,
                uid: uid
            });

            // Reset đếm ngược
            setCountdown(120);
            setSuccessMessage("Mã xác thực mới đã được gửi đến email của bạn.");

            setTimeout(() => {
                setSuccessMessage("");
            }, 3000);
        } catch (err) {
            console.error("Lỗi khi gửi lại OTP:", err.response || err);
            setErrorMessages(["Không thể gửi lại mã OTP. Vui lòng thử lại sau."]);
            setShowToast(true);
        } finally {
            setIsResending(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const closeToast = () => {
        setShowToast(false);
    };

    const handleGoBack = () => {
        navigate("/signin");
    };

    return (
        <GalaxyBackground>
            <div className="main-container">
                <div className="otp-verification-container" style={{
                    maxWidth: "400px",
                    margin: "0 auto",
                    padding: "20px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "10px",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                }}>
                    <h2 style={{ textAlign: "center", color: "#fff", marginBottom: "20px" }}>Xác thực tài khoản</h2>

                    <p style={{ textAlign: "center", color: "#eee", marginBottom: "20px" }}>
                        Mã xác thực đã được gửi đến email: <br />
                        <strong>{email}</strong>
                    </p>

                    {successMessage && (
                        <div style={{
                            color: "green",
                            marginBottom: "15px",
                            fontWeight: "bold",
                            textAlign: "center",
                            padding: "8px",
                            borderRadius: "4px",
                            backgroundColor: "rgba(0, 255, 0, 0.1)"
                        }}>
                            ✅ {successMessage}
                        </div>
                    )}

                    <div style={{ textAlign: "center", marginBottom: "20px" }}>
                        <input
                            type="text"
                            placeholder="Nhập mã OTP 6 số"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            style={{
                                padding: "12px",
                                fontSize: "16px",
                                width: "80%",
                                textAlign: "center",
                                letterSpacing: "5px",
                                borderRadius: "5px",
                                border: "1px solid #ccc",
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                color: "#fff"
                            }}
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                        <button
                            onClick={handleVerifyOtp}
                            disabled={loading}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#4285F4",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer",
                                fontSize: "16px",
                                width: "80%"
                            }}
                        >
                            {loading ? "Đang xử lý..." : "Xác thực"}
                        </button>
                    </div>

                    <div style={{ textAlign: "center", fontSize: "14px", color: "#ddd" }}>
                        <p>
                            {countdown > 0 ? (
                                <>
                                    Gửi lại mã sau: <strong>{formatTime(countdown)}</strong>
                                </>
                            ) : (
                                <span
                                    onClick={handleResendOtp}
                                    style={{
                                        color: "#4285F4",
                                        cursor: "pointer",
                                        textDecoration: "underline"
                                    }}
                                >
                  Gửi lại mã
                </span>
                            )}
                        </p>

                        <p style={{ marginTop: "15px" }}>
              <span
                  onClick={handleGoBack}
                  style={{
                      color: "#aaa",
                      cursor: "pointer",
                      textDecoration: "underline"
                  }}
              >
                Quay lại đăng nhập
              </span>
                        </p>
                    </div>
                </div>

                {/* Error Toast Component */}
                {showToast && errorMessages.length > 0 && (
                    <ErrorToast
                        messages={errorMessages}
                        onClose={closeToast}
                    />
                )}
            </div>
        </GalaxyBackground>
    );
}