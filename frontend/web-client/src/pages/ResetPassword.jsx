import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import GalaxyBackground from "./components/GalaxyBackground";
import '../styles/OTP.css';

export default function ResetPassword() {

    // Set focus to first input on component mount
    useEffect(() => {
        if (inputRefs.current[0]) {
            setTimeout(() => {
                inputRefs.current[0].focus();
            }, 200); // Small delay to ensure DOM is ready
        }
    }, []);

    useEffect(() => {
        if (timer > 0 && !canResend) {
            const interval = setInterval(() => {
                setTimer((prevTimer) => prevTimer - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else if (timer === 0 && !canResend) {
            setCanResend(true);
        }
    }, [timer, canResend]);

    const handleInputChange = (index, value) => {
        console.log(`Input change at index ${index}: ${value}`);

        // Allow only numbers or empty string (for deletion)
        if (value !== "" && !/^\d+$/.test(value)) {
            console.log("Rejecting non-numeric input");
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus to next input if current input is filled
        if (value !== "" && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        console.log(`Key down at index ${index}: ${e.key}`);

        // Move to previous input on backspace if current input is empty
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleResendOTP = () => {
        // Implement your resend OTP logic here
        setTimer(60);
        setCanResend(false);
        // Call your sendOTP function here
        alert("Resending OTP to " + email);
    };

    const handleVerifyOTP = () => {
        const otpCode = otp.join("");
        console.log("Verifying OTP:", otpCode);

        if (otpCode.length !== 6) {
            alert("Please enter the complete 6-digit OTP");
            return;
        }

        // Implement your OTP verification logic here
        alert(`Verifying OTP: ${otpCode}`);
        // On successful verification, navigate to reset password page
        // navigate("/reset-password", { state: { email, otpCode } });
    };

    // Click handler to focus the input when the container is clicked
    const handleContainerClick = (index) => {
        if (inputRefs.current[index]) {
            inputRefs.current[index].focus();
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
                        <span className="text-dangki">
                            Đã gửi tới email: {email}
                        </span>

                        <div className="otp-container">
                            {otp.map((digit, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleContainerClick(index)}
                                    style={{ position: 'relative' }}
                                >
                                    <input
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleInputChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="otp-input"
                                        placeholder="—"
                                        autoComplete="off"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="section-2s">
                            <p>
                                {canResend ? (
                                    <span name ="section-2sq"
                                          onClick={handleResendOTP}
                                          className="text-blue-500 hover:underline"
                                    >
                                        Gửi lại (1/3)
                                    </span>
                                ) : (
                                    <span>
                                        Chưa nhận được mã? Gửi lại ({timer}s)
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <button className={"btn-sendOTP"}
                                    onClick={handleVerifyOTP}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-2"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Send
                            </button>
                        </div>
                    </div>
                </div>
                <span className="text-d">Loopup xin chào</span>
            </div>
        </GalaxyBackground>
    );
}