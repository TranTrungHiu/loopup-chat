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
      <div onClick={togglePasswordVisibility}>
        <div
          dangerouslySetInnerHTML={{
            __html:
              '<svg id="17:27" layer-name="Frame" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="eye-icon" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); width: 24px; height: 24px; cursor: pointer"> <path d="M15 18L14.278 14.75" stroke="#5474F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M2 8C2.74835 10.0508 4.10913 11.8219 5.8979 13.0733C7.68667 14.3247 9.81695 14.9959 12 14.9959C14.1831 14.9959 16.3133 14.3247 18.1021 13.0733C19.8909 11.8219 21.2516 10.0508 22 8" stroke="#5474F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M20 15L18.274 12.95" stroke="#5474F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M4 15L5.726 12.95" stroke="#5474F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M9 18L9.722 14.75" stroke="#5474F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </svg>',
          }}
        />
      </div>
    </div>
  );
}

export default PasswordInput;
