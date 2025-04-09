import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EmailInput from "./components/auth/EmailInput";
import sendOTP from "./components/auth/sendOTP";
import GalaxyBackground from "./components/GalaxyBackground";
import OTPVerificationPage from "./OTPVerificationPage";
import SendOTP from "./components/auth/sendOTP";
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const handleSendOTP = async () => {
        // Basic email validation
        if (!email || !email.includes('@') || !email.includes('.')) {
            alert("Vui lòng nhập email hợp lệ");
            return;
        }

        setIsLoading(true);

        try {
            // Here you would call your actual API function to send OTP
            // For example: await sendOTPToEmail(email);
            console.log("Sending OTP to:", email);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Navigate to OTP verification page after successful API call
            navigate("/verify-otp", { state: { email } });
        } catch (error) {
            console.error("Error sending OTP:", error);
            alert("Có lỗi xảy ra khi gửi mã OTP. Vui lòng thử lại sau.");
        } finally {
            setIsLoading(false);
        }
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
                        <span className="text-wellcome">Nhập email đã đăng ký tài khoản để lấy mật khẩu </span>
                        <EmailInput email={email} setEmail={setEmail} />
                        <sendOTP/>
                    </div>
                    <SendOTP
                        onClick={handleSendOTP}
                        disabled={isLoading}
                        className="send-otp-button"

                    >
                        {isLoading ? "Đang gửi..." : "Gửi mã xác nhận"}
                    </SendOTP>


                </div>

                <span className="text-d">Loopup xin chào</span>
            </div>
        </GalaxyBackground>
    );
}