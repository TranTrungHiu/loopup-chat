"use client";
import React, { useState } from "react";
import styles from "./InputDesign.module.css";
import FormInput from "./FormInput";
import PasswordInput from "./PasswordInput";
import GenderSelection from "./GenderSelection";
import SubmitButton from "./SubmitButton";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const handleSignIn = async () => {
    navigate("/signin");
  };

  const [message, setMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox" ? checked : type === "file" ? files[0] : value,
    });
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

    if (formData.password !== formData.confirmPassword) {
      setMessage("Mật khẩu không khớp.");
      return;
    }

    if (!formData.acceptTerms) {
      setMessage("Vui lòng chấp nhận điều khoản.");
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

      setMessage(response.data.message || "Đăng ký thành công!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Đăng ký thất bại.");
    }
  };

  return (
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
          />
          <FormInput
            type="text"
            placeholder="Tên"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
          />
        </div>

        <FormInput
          type="email"
          placeholder="Nhập email của bạn"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
        />

        <FormInput type="file" name="avatarFile" onChange={handleInputChange} />

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
          />
          <PasswordInput
            placeholder="Nhập lại mật khẩu"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
          />
        </div>

        <div className={styles.termsCheckbox}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleInputChange}
            />
            <span />
          </label>
          <p className={styles.termsText}>
            <span>Chấp nhận</span>{" "}
            <span className={styles.termsLink}>chính sách yêu cầu</span>{" "}
            <span>của Loopup</span>
          </p>
        </div>

        <SubmitButton />

        {message && <p className={styles.messageFeedback}>{message}</p>}

        <p className={styles.loginPrompt}>
          <button>Bạn đã có tài khoản ?</button>{" "}
          <span className={styles.loginLink} onClick={handleSignIn}>
            Đăng nhập ngay
          </span>
        </p>
      </form>
    </div>
  );
}

export default RegistrationForm;
