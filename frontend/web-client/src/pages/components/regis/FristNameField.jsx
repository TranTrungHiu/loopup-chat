// components/auth/EmailInput.jsx
import React from "react";

const FirstNameField = ({ fisrtName, setfisrtName }) => {
    return (
        <div className="ho">
            <input
                type="text"
                placeholder="Họ"
                value={fisrtName}
                onChange={(e) => setfisrtName(e.target.value)}
                className="input-box"
            />
        </div>
    );
};

export default FirstNameField;