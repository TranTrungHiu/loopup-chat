import React, { useState } from 'react';
import axios from 'axios';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');

  const handleSignUp = async () => {
    try {
      const res = await axios.post('http://localhost:8080/api/auth/signup', {
        email,
        password: pass
      });
      setMsg(res.data.message);
    } catch (err) {
      setMsg(err.response?.data?.message || "Đăng ký thất bại.");
    }
  };

  return (
    <div className="form-container">
      <h2>Đăng ký</h2>
      <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPass(e.target.value)} />
      <button onClick={handleSignUp}>Đăng ký</button>
      <p>{msg}</p>
    </div>
  );
}
