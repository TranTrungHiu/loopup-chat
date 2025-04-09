import React from "react";
import styles from "./InputDesign.module.css";

function GenderSelection({ selectedGender, onChange }) {
  return (
    <div className={styles.genderSelection}>
      <p className={styles.genderLabel}>Bạn là :</p>
      <div className={styles.genderOptions}>
        <div className={styles.genderOption}>
          <label>
            <input
              type="radio"
              name="gender"
              value="female"
              checked={selectedGender === "female"}
              onChange={onChange}
            />
            <span className={styles.genderText}>Nữ</span>
            <div>
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    '<svg id="32:15" layer-name="SVG" width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" class="heart-icon pink" style="width: 25px; height: 25px"> <path d="M17.1973 1.99683C14.945 2.03396 12.8833 3.34517 11.7925 5.43433C10.7016 3.34517 8.63998 2.03396 6.3876 1.99683C2.71536 2.16595 -0.138581 5.4471 2.00775e-05 9.34058C2.00775e-05 14.077 4.70324 19.25 8.64782 22.7572C10.4659 24.3767 13.119 24.3767 14.9371 22.7572C18.8817 19.25 23.5849 14.077 23.5849 9.34058C23.7235 5.4471 20.8696 2.16595 17.1973 1.99683ZM13.6744 21.1635C12.5869 22.1342 10.9981 22.1342 9.91059 21.1635C4.86146 16.6729 1.96543 12.3645 1.96543 9.34058C1.82559 6.59702 3.8004 4.24788 6.3876 4.08016C8.9748 4.24788 10.9496 6.59702 10.8098 9.34058C10.8098 9.91549 11.2501 10.3822 11.7925 10.3822C12.3348 10.3822 12.7752 9.91549 12.7752 9.34058C12.6353 6.59702 14.6101 4.24788 17.1973 4.08016C19.7845 4.24788 21.7594 6.59702 21.6195 9.34058C21.6195 12.3645 18.7235 16.6729 13.6744 21.1593" fill="#FF5B89"></path> </svg>',
                }}
              />
            </div>
          </label>
        </div>
        <div className={styles.genderOption}>
          <label>
            <input
              type="radio"
              name="gender"
              value="male"
              checked={selectedGender === "male"}
              onChange={onChange}
            />
            <span className={styles.genderText}>Nam</span>
            <div>
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    '<svg id="32:18" layer-name="SVG" width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" class="heart-icon blue" style="width: 25px; height: 25px"> <path d="M14.9419 1.99683C12.985 2.03396 11.1937 3.34517 10.2459 5.43433C9.2981 3.34517 7.50684 2.03396 5.54986 1.99683C2.35922 2.16595 -0.120428 5.4471 -4.5686e-06 9.34058C-4.5686e-06 14.077 4.0864 19.25 7.51366 22.7572C9.0933 24.3767 11.3985 24.3767 12.9781 22.7572C16.4054 19.25 20.4918 14.077 20.4918 9.34058C20.6122 5.4471 18.1326 2.16595 14.9419 1.99683ZM11.881 21.1635C10.9361 22.1342 9.55568 22.1342 8.61082 21.1635C4.22387 16.6729 1.70765 12.3645 1.70765 9.34058C1.58615 6.59702 3.30196 4.24788 5.54986 4.08016C7.79775 4.24788 9.51357 6.59702 9.39207 9.34058C9.39207 9.91549 9.77466 10.3822 10.2459 10.3822C10.7171 10.3822 11.0997 9.91549 11.0997 9.34058C10.9782 6.59702 12.694 4.24788 14.9419 4.08016C17.1898 4.24788 18.9056 6.59702 18.7841 9.34058C18.7841 12.3645 16.2679 16.6729 11.881 21.1593" fill="#5BADFF"></path> </svg>',
                }}
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

export default GenderSelection;
