"use client";
import React, { useState } from "react";
import styles from "./InputDesign.module.css";

function PasswordInput({ placeholder, name, value, onChange }) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.inputWrapper}>
      <input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={onChange}
        className={styles.input}
      />
      <div
        className={`${styles.passwordToggle} ${
          showPassword ? styles.showing : ""
        }`}
        onClick={togglePasswordVisibility}
      >
        {showPassword ? (
          // Eye open icon when password is visible
          <svg
            className={styles.eyeIcon}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
              stroke="#5474F2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
              stroke="#5474F2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          // Eye closed icon when password is hidden
          <svg
            className={styles.eyeIcon}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.76 5.7C10.4699 5.23488 11.2759 4.99749 12.096 5.00006C17.5 5.00006 21.5 12 21.5 12C20.8323 13.1865 20.0068 14.2742 19.044 15.232M14.764 14.736C14.3135 15.0366 13.7834 15.1964 13.2396 15.1933C12.6958 15.1902 12.1675 15.0243 11.7209 14.7184C11.2742 14.4126 10.9267 13.9798 10.7178 13.4764C10.5089 12.973 10.4475 12.4213 10.5411 11.8853C10.6348 11.3494 10.8795 10.8543 11.2432 10.4631C11.6069 10.0719 12.0739 9.80358 12.5855 9.68175C13.0971 9.55991 13.6316 9.59143 14.1255 9.77175C14.6194 9.95207 15.0517 10.2744 15.36 10.696"
              stroke="#5474F2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2.5 4L7.394 8.89397"
              stroke="#5474F2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15.5 17L21.5 23"
              stroke="#5474F2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2.5 23L10 15.5"
              stroke="#5474F2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

export default PasswordInput;
