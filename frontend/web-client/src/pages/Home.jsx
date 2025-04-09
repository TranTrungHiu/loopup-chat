import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";

export default function Home() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lấy uid từ localStorage
  const uid = localStorage.getItem("uid");

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate("/signin");
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  useEffect(() => {
    // Nếu không có uid, chuyển hướng về trang đăng nhập
    if (!uid) {
      navigate("/signin");
      return;
    }

    const fetchUserInfo = async () => {
      try {
        setLoading(true);

        // Lấy token từ localStorage
        const token = localStorage.getItem("idToken");
        if (!token) {
          throw new Error("Không tìm thấy token");
        }

        // Thử gọi API lấy thông tin profile
        // Thử cả hai endpoint để đảm bảo một trong hai hoạt động
        try {
          // Thử gọi API /api/user/profile trước
          const response = await axios.get("http://localhost:8080/api/user/profile", {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data) {
            setUserInfo(response.data);
          }
        } catch (userProfileError) {
          // Nếu lỗi, thử gọi API /api/auth/profile
          try {
            const response = await axios.get("http://localhost:8080/api/auth/profile", {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data) {
              setUserInfo(response.data);
            }
          } catch (authProfileError) {
            // Nếu cả hai đều lỗi, thử gọi API /api/auth/user-info
            try {
              const response = await axios.get(`http://localhost:8080/api/auth/user-info?uid=${uid}`);

              if (response.data) {
                setUserInfo(response.data);
              }
            } catch (userInfoError) {
              console.error("Không thể lấy thông tin từ tất cả các API:", userInfoError);
              // Sử dụng thông tin từ localStorage
              setUserInfo({
                email: localStorage.getItem("email") || "Chưa có thông tin",
                firstName: localStorage.getItem("firstName") || "Người dùng",
                lastName: localStorage.getItem("lastName") || "",
                gender: ""
              });
            }
          }
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin người dùng:", error);
        // Sử dụng thông tin từ localStorage
        setUserInfo({
          email: localStorage.getItem("email") || "Chưa có thông tin",
          firstName: localStorage.getItem("firstName") || "Người dùng",
          lastName: localStorage.getItem("lastName") || "",
          gender: ""
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [uid, navigate]);

  return (
      <div className="home-container">
        <h1>Chào mừng bạn đến với Loopup Chat! 🎉</h1>

        {loading ? (
            <p>Đang tải thông tin người dùng...</p>
        ) : userInfo ? (
            <>
              <img
                  src="/default-avatar.png"
                  alt="avatar"
                  style={{ width: 100, height: 100, borderRadius: "50%" }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23ccc'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='40' fill='%23555'%3E👤%3C/text%3E%3C/svg%3E";
                  }}
              />
              <p>
                <strong>Họ tên:</strong> {userInfo.firstName} {userInfo.lastName}
              </p>
              <p>
                <strong>Email:</strong> {userInfo.email}
              </p>
              {userInfo.gender && (
                  <p>
                    <strong>Giới tính:</strong> {userInfo.gender}
                  </p>
              )}
            </>
        ) : (
            <p>Không thể tải thông tin người dùng.</p>
        )}

        <button onClick={handleLogout}>Đăng xuất</button>
      </div>
  );
}