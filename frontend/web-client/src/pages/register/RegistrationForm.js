"use client";
import React, { useState, useRef } from "react";
import styles from "./InputDesign.module.css";
import FormInput from "./FormInput";
import PasswordInput from "./PasswordInput";
import GenderSelection from "./GenderSelection";
import SubmitButton from "./SubmitButton";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../component/styles/Toast.css";

function RegistrationForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
    password: "",
    confirmPassword: "",
    avatarFile: null,
    acceptTerms: false,
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const handleSignIn = () => {
    navigate("/signin");
  };

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === "file" && files[0]) {
      setFormData({
        ...formData,
        avatarFile: files[0],
      });
      
      // Create preview URL for the selected image
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const uploadAvatarToS3 = async (file) => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const response = await axios.get(
        `http://localhost:8080/api/s3/generate-presigned-url`,
        {
          params: { fileName },
        }
      );

      const signedUrl = response.data.url;

      console.log("Uploading file:", file);
      console.log("File type:", file.type);
      console.log("Signed URL:", signedUrl);

      await axios.put(signedUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
      });

      return signedUrl.split("?")[0];
    } catch (error) {
      console.error("Lỗi khi tải ảnh lên S3:", error);
      throw new Error("Không thể tải ảnh lên S3.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu không khớp!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        transition: Bounce,
        className: "custom-toast-error",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      toast.error("Vui lòng chấp nhận điều khoản!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        transition: Bounce,
        className: "custom-toast-error",
      });
      setIsLoading(false);
      return;
    }

    try {
      let avatarUrl = null;

      if (formData.avatarFile) {
        avatarUrl = await uploadAvatarToS3(formData.avatarFile);
      }

      const response = await axios.post(
        "http://localhost:8080/api/auth/signup",
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          gender: formData.gender,
          avatarUrl: avatarUrl,
        }
      );

      // Hiển thị thông báo đăng ký thành công với toast
      toast.success("Đăng ký thành công! Chuyển hướng đến trang đăng nhập...", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        transition: Bounce,
        onClose: () => navigate("/signin"),
        className: "custom-toast-success",
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Đăng ký thất bại.";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        transition: Bounce,
        className: "custom-toast-error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <div className={styles.formContainer}>
          <h1 className={styles.formTitle}>Loopup xin chào</h1>
          <form className={styles.formFields} onSubmit={handleSubmit}>
            <div className={styles.nameFieldsRow}>
              <FormInput
                type="text"
                placeholder="Họ"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
              <FormInput
                type="text"
                placeholder="Tên"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>

            <FormInput
              type="email"
              placeholder="Nhập email của bạn"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />

            <div className={styles.avatarContainer}>
              <div 
                className={styles.avatarPreview} 
                onClick={triggerFileInput}
                style={avatarPreview ? {backgroundImage: `url(${avatarPreview})`} : {}}
              >
                {!avatarPreview && <span>+</span>}
              </div>
              <div className={styles.avatarInfo}>
                <h3>Ảnh đại diện</h3>
                <p>Chọn ảnh đại diện của bạn</p>
              </div>
              <input 
                type="file" 
                name="avatarFile" 
                onChange={handleInputChange} 
                ref={fileInputRef}
                accept="image/*"
                className={styles.fileInput}
              />
            </div>

            <GenderSelection
              selectedGender={formData.gender}
              onChange={handleInputChange}
            />

            <div className={styles.passwordFieldsRow}>
              <PasswordInput
                placeholder="Nhập mật khẩu"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <PasswordInput
                placeholder="Nhập lại mật khẩu"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.termsCheckbox}>
              <label className={styles.customCheckbox}>
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                />
                <span className={styles.checkmark}></span>
              </label>
              <p className={styles.termsText}>
                <span>Chấp nhận</span>{" "}
                <span className={styles.termsLink}>chính sách yêu cầu</span>{" "}
                <span>của Loopup</span>
              </p>
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isLoading}
            >
              <div className={styles.buttonContent}>
                <span className={styles.buttonText}>Đăng ký</span>
                <div className={styles.arrowContainer}>
                  {isLoading ? (
                    <div className={styles.loadingSpinner}></div>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 0L6.59 1.41L12.17 7H0V9H12.17L6.59 14.59L8 16L16 8L8 0Z" fill="white"/>
                    </svg>
                  )}
                </div>
              </div>
            </button>

            <p className={styles.loginPrompt}>
              <span>Bạn đã có tài khoản?</span>{" "}
              <span className={styles.loginLink} onClick={handleSignIn}>
                Đăng nhập ngay
              </span>
            </p>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default RegistrationForm;
