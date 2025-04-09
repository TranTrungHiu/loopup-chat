import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../pages/styles/SignIn.css"; // Ensure you have the correct path to your CSS file

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleSignIn = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      const token = await userCred.user.getIdToken();

      const res = await axios.post("http://localhost:8080/api/auth/login", { idToken: token });

      if (res.status === 200) {
        setMsg("✅ Đăng nhập thành công!");
        localStorage.setItem("uid", res.data.uid);
        localStorage.setItem("email", res.data.email);
        setTimeout(() => navigate("/home"), 1000);
      } else {
        setMsg("❌ Đăng nhập thất bại.");
      }
    } catch (err) {
      console.error(err);
      setMsg("❌ " + (err.response?.data || err.message));
    }
  };

  return (
    <div className="main-container">
      <div className="wrapper">
        <div className="img" />
      </div>
      <div className="box" />
      <div className="box-2">
        <div className="section">
          <div className="img-2" />
          <span className="text">vui lòng đăng nhập để tiếp tục</span>

          <div className="wrapper-2">
            <div className="pic" />
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-email"
            />
          </div>

          <div className="box-3">
            <div className="img-3" />
            <div className="pic-2" />
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className=" "
            />
          </div>

          <div className="pic-3" />
          <div className="box-4">
            <span className="text-4">Quên</span>
            <span className="text-5"> mật khẩu</span>
          </div>
          <span className="text-6">Nhớ mật khẩu</span>

          <div className="wrapper-3">
          <button onClick={handleSignIn}>
  <div class="svg-wrapper-1">
    <div class="svg-wrapper">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
      >
        <path fill="none" d="M0 0h24v24H0z"></path>
        <path
          fill="currentColor"
          d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
        ></path>
      </svg>
    </div>
  </div>
         <span>LOGIN</span>
      </button>
          </div>
          


          <p style={{ color: "red", marginTop: "10px" }}>{msg}</p>

          <span className="text-a">hay tiếp tục </span>
          <div className="pic-6" />
          <div className="pic-7" />
          <div className="section-2">
            <div className="pic-8" />
          </div>
          <div className="group-2">
            <div className="pic-9" />
          </div>
        </div>

        <div className="section-3">
          <span className="text-b">Bạn chưa có tài khoản ?</span>
          <span className="text-c"> Đăng ký ngay</span>
        </div>
      </div>

      <span className="text-d">Loopup xin chào</span>
    </div>
  );
}
