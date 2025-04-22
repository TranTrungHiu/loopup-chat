import axios from "axios";
import { signOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export const handleLogout = async (navigate) => {
  await signOut(auth);
  localStorage.clear();
  navigate("/signin");
};

export const handleSignIn = async (email, pass, navigate, setMsg) => {
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, pass);
    const token = await userCred.user.getIdToken();

    const res = await axios.post("http://localhost:8080/api/auth/login", {
      idToken: token,
    });

    if (res.status === 200) {
      localStorage.setItem("idToken", token);
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

// Lấy thông tin người dùng
export const fetchUserInfo = async (token) => {
  const response = await axios.get(`http://localhost:8080/api/user/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Lấy danh sách cuộc trò chuyện
export const fetchChats = async (token) => {
  const response = await axios.get(`http://localhost:8080/api/chats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Lấy danh sách tất cả người dùng
export const fetchAllUsers = async (token) => {
  const response = await axios.get(`http://localhost:8080/api/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Lấy tin nhắn theo chatId
export const fetchMessages = async (chatId, token) => {
  const response = await axios.get(
    `http://localhost:8080/api/messages/${chatId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Gửi tin nhắn
export const sendMessage = async (chatId, sender, message, token) => {
  const response = await axios.post(
    `http://localhost:8080/api/messages`,
    {
      chatId,
      sender,
      message,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
export const fetchParticipantInfo = async (chatId, currentUserId) => {
    const response = await axios.get(
      `http://localhost:8080/api/chats/${chatId}/participant`,
      {
        params: { currentUserId },
      }
    );
    return response.data; // Trả về thông tin người dùng
  };
  export const fetchUserByUid = async (uid, token) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/user/${uid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data; // Trả về thông tin người dùng
    } catch (err) {
      console.error("Lỗi khi lấy thông tin người dùng:", err);
      throw err; // Ném lỗi để xử lý ở nơi gọi hàm
    }
  };