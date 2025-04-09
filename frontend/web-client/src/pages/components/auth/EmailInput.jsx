// components/auth/EmailInput.jsx
import React from "react";

const EmailInput = ({ email, setEmail }) => {
    return (
        <div className="wrapper-2">
            {/* SVG icon thay vì dùng background image */}
            <div className="pic">
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
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-box"
            />
        </div>
    );
};

export default EmailInput;