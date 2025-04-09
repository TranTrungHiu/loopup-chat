// components/auth/PasswordInput.jsx
import React, { useState } from "react";

const PasswordInput = ({ password, setPassword }) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="box-3">
            {/* SVG icon cho password thay vì background image */}
            <div className="img-3">
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                </svg>
            </div>
            <input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-box"
            />
            {/* SVG icon cho hiển thị/ẩn mật khẩu */}
            <div className="pic-2" onClick={togglePasswordVisibility}>
                {showPassword ? (
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >

                    </svg>
                ) : (
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <line x1="2" y1="22" x2="22" y2="2" stroke="#91B7D5" strokeWidth="2"/>
                    </svg>
                )}
            </div>
        </div>
    );
};

export default PasswordInput;