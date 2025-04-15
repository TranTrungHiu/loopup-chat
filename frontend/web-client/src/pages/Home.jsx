import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";

export default function Home() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [chats, setChats] = useState([]); // Danh sách các cuộc trò chuyện
  const [allUsers, setAllUsers] = useState([]); // Danh sách tất cả người dùng
  const [selectedUser, setSelectedUser] = useState(""); // Người dùng được chọn để nhắn tin
  const [newMessage, setNewMessage] = useState(""); // Tin nhắn mới
  const [messages, setMessages] = useState([]); // Danh sách tin nhắn
  const [selectedChatId, setSelectedChatId] = useState(""); // ID của cuộc trò chuyện được chọn
  const [email, setEmail] = useState(""); // Email để đăng nhập
  const [pass, setPass] = useState(""); // Mật khẩu để đăng nhập
  const [msg, setMsg] = useState(""); // Thông báo trạng thái

  const uid = localStorage.getItem("uid");

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear(); // Xóa toàn bộ dữ liệu trong localStorage
    navigate("/signin");
  };

  const handleSignIn = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCred.user;
      const token = await user.getIdToken();

      const res = await axios.post("http://localhost:8080/api/auth/login", {
        idToken: token,
      });

      if (res.status === 200) {
        // Lưu thông tin vào localStorage
        localStorage.setItem("idToken", token);
        localStorage.setItem("uid", res.data.uid);
        localStorage.setItem("email", res.data.email);

        // Chuyển hướng đến trang Home
        setTimeout(() => navigate("/home"), 1000);
      } else {
        setMsg("❌ Đăng nhập thất bại.");
      }
    } catch (err) {
      console.error(err);
      setMsg("❌ " + (err.response?.data || err.message));
    }
  };

  useEffect(() => {
    const uid = localStorage.getItem("uid");
    if (!uid) {
      alert("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      navigate("/signin");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/user/profile`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("idToken")}`,
            },
          }
        );
        setUserInfo(response.data);
      } catch (error) {
        console.error("Lỗi lấy thông tin người dùng:", error);
      }
    };

    const fetchChats = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/chats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("idToken")}`,
          },
        });
        setChats(response.data);
      } catch (error) {
        console.error("Lỗi lấy danh sách cuộc trò chuyện:", error);
      }
    };

    const fetchAllUsers = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/user`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("idToken")}`,
          },
        });
        setAllUsers(response.data);
      } catch (error) {
        console.error("Lỗi lấy danh sách người dùng:", error);
      }
    };

    fetchUserInfo();
    fetchChats();
    fetchAllUsers();
  }, []);

  const fetchMessages = async (chatId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/messages/${chatId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("idToken")}`,
          },
        }
      );
      setMessages(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy tin nhắn:", error);
    }
  };

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);
    }
  }, [selectedChatId]);

  const handleSendMessage = async () => {
    const uid = localStorage.getItem("uid"); // Lấy UID từ localStorage

    if (!uid) {
      alert("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      navigate("/signin");
      return;
    }

    if (!selectedUser || !newMessage) {
      alert("Vui lòng chọn người dùng và nhập tin nhắn.");
      return;
    }

    const chatId = [uid, selectedUser].sort().join("_"); // Tạo chatId từ uid
    console.log("Chat ID:", chatId); // In ra chatId để kiểm tra
    try {
      await axios.post(
        `http://localhost:8080/api/messages`,
        {
          chatId,
          sender: uid,
          message: newMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("idToken")}`,
          },
        }
      );
      alert("Tin nhắn đã được gửi!");
      setNewMessage("");
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
    }
  };

  const renderMessages = (messages) => {
    const uid = localStorage.getItem("uid"); // Lấy UID của người dùng đang đăng nhập

    return messages.map((message) => (
      <div
        key={message.messageId}
        style={{
          textAlign: message.sender === uid ? "right" : "left", // Canh phải nếu là tin nhắn của chính người dùng
          margin: "10px 0",
        }}
      >
        <p
          style={{
            display: "inline-block",
            padding: "10px",
            borderRadius: "10px",
            backgroundColor: message.sender === uid ? "#DCF8C6" : "#FFF", // Màu khác nhau cho tin nhắn gửi và nhận
            maxWidth: "60%",
          }}
        >
          {message.message}
        </p>
      </div>
    ));
  };

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

      <h2>Danh sách cuộc trò chuyện</h2>
      <ul>
        {chats.map((chat) => {
          const otherParticipants = chat.participants
            .filter((participant) => participant !== uid)
            .map((participant) => {
              const user = allUsers.find((user) => user.uid === participant);
              return user ? `${user.firstName} ${user.lastName}` : participant; // Hiển thị tên nếu tìm thấy, nếu không hiển thị UID
            });

          return (
            <li
              key={chat.chatId}
              onClick={() => setSelectedChatId(chat.chatId)}
            >
              <strong>Cuộc trò chuyện với:</strong>{" "}
              {otherParticipants.join(", ")} {/* Hiển thị tên người khác */}
              <p>{chat.lastMessage}</p>
            </li>
          );
        })}
      </ul>

      <h2>Tin nhắn</h2>
      <div>{renderMessages(messages)}</div>

      <h2>Gửi tin nhắn mới</h2>
      <select
        value={selectedUser}
        onChange={(e) => setSelectedUser(e.target.value)}
      >
        <option value="">Chọn người dùng</option>
        {allUsers
          .filter((user) => user.uid !== uid) // Loại bỏ chính người dùng đang đăng nhập
          .map((user) => (
            <option key={user.uid} value={user.uid}>
              {user.firstName} {user.lastName}
            </option>
          ))}
      </select>
      <textarea
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Nhập tin nhắn..."
      />
      <button onClick={handleSendMessage}>Gửi tin nhắn</button>

      <button onClick={handleLogout}>Đăng xuất</button>
    </div>
  );
}
