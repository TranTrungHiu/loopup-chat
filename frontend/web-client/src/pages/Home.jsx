import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";

export default function Home() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  const uid = localStorage.getItem("uid");

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    navigate("/signin");
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/user/profile`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("idToken")}`,
            },
          }
        );
        console.log("Token:", sessionStorage.getItem("idToken"));
        setUserInfo(response.data);
      } catch (error) {
        console.error("Lỗi lấy thông tin người dùng:", error);
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <div className="home-container">
      <h1>Chào mừng bạn đến với Loopup Chat! 🎉</h1>

      {userInfo ? (
        <>
          <img
            src={userInfo.avatarUrl}
            alt="avatar"
            style={{ width: 100, height: 100, borderRadius: "50%" }}
          />
          <p>
            <strong>Họ tên:</strong> {userInfo.firstName} {userInfo.lastName}
          </p>
          <p>
            <strong>Email:</strong> {userInfo.email}
          </p>
          <p>
            <strong>Giới tính:</strong> {userInfo.gender}
          </p>
        </>
      ) : (
        <p>Đang tải thông tin người dùng...</p>
      )}

      <button onClick={handleLogout}>Đăng xuất</button>
    </div>
  );
}
