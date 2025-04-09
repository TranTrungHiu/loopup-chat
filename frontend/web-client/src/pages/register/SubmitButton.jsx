import React from "react";
import styles from "./InputDesign.module.css";

function SubmitButton() {
  return (
    <button type="submit" className={styles.submitButton}>
      <div className={styles.buttonContent}>
        <span className={styles.buttonText}>Đăng ký</span>
        <div className={styles.arrowContainer}>
          <div
            dangerouslySetInnerHTML={{
              __html:
                '<svg id="28:255" layer-name="Arrow" width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" class="arrow-icon"> <g clip-path="url(#clip0_28_255)"> <path d="M3.75 14.0625C3.75 14.5799 4.17008 15 4.6875 15H23.0494L19.0256 19.0238C18.6703 19.3916 18.6754 19.9763 19.037 20.338C19.3987 20.6996 19.9834 20.7047 20.3512 20.3494L25.9762 14.7244C26.1515 14.5502 26.25 14.3133 26.25 14.0662V14.0625C26.25 13.9406 26.2256 13.8188 26.1769 13.7044C26.1301 13.5907 26.0613 13.4875 25.9744 13.4006L20.3494 7.77563C19.9815 7.42034 19.3968 7.42542 19.0352 7.78705C18.6735 8.14867 18.6685 8.73339 19.0238 9.10125L23.0494 13.125H4.6875C4.17008 13.125 3.75 13.5451 3.75 14.0625Z" fill="#FFE4E4" fill-opacity="0.72"></path> </g> <defs> <clipPath id="clip0_28_255"> <rect width="30" height="30" fill="white"></rect> </clipPath> </defs> </svg>',
            }}
          />
        </div>
      </div>
    </button>
  );
}

export default SubmitButton;
