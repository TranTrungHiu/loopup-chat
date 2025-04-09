import React from "react";
import styles from "./InputDesign.module.css";

function FormInput({ type, placeholder, name, value, onChange }) {
  return (
    <div className={styles.inputWrapper}>
      <input
        type={type}
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={onChange}
        className={styles.input}
      />
    </div>
  );
}

export default FormInput;
