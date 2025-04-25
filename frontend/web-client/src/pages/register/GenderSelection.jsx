import React from "react";
import styles from "./InputDesign.module.css";

function GenderSelection({ selectedGender, onChange }) {
  return (
    <div className={styles.genderSelection}>
      <div className={styles.genderLabel}>Bạn là :</div>
      <div className={styles.genderOptions}>
        <label className={styles.genderOption}>
          <input
            type="radio"
            name="gender"
            value="female"
            checked={selectedGender === "female"}
            onChange={onChange}
            className={styles.genderRadio}
          />
          <div
            className={`${styles.heartIcon} ${styles.femaleHeart} ${
              selectedGender === "female" ? styles.active : ""
            }`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill={selectedGender === "female" ? "#FF6B9D" : "#E2E8F0"}
              />
            </svg>
          </div>
          <span className={styles.genderText}>Nữ</span>
        </label>
        <label className={styles.genderOption}>
          <input
            type="radio"
            name="gender"
            value="male"
            checked={selectedGender === "male"}
            onChange={onChange}
            className={styles.genderRadio}
          />
          <div
            className={`${styles.heartIcon} ${styles.maleHeart} ${
              selectedGender === "male" ? styles.active : ""
            }`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill={selectedGender === "male" ? "#60A5FA" : "#E2E8F0"}
              />
            </svg>
          </div>
          <span className={styles.genderText}>Nam</span>
        </label>
      </div>
    </div>
  );
}

export default GenderSelection;
