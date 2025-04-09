import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Home() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email");

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    navigate("/signin");
  };

  return (
    <div className="home-container">
      <h1>Chào mừng bạn đến với Loopup Chat! 🎉</h1>
      <p>Đăng nhập bằng: <strong>{email}</strong></p>
      <button onClick={handleLogout}>Đăng xuất</button>
    </div>
  );
}
