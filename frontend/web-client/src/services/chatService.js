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
  try {
    // Lấy uid của người dùng hiện tại
    const currentUserId = localStorage.getItem("uid");
    
    if (!currentUserId) {
      console.error("Không tìm thấy UID người dùng hiện tại");
      return [];
    }
    
    console.log(`Đang lấy danh sách chat cho người dùng ${currentUserId}`);
    const response = await axios.get(`http://localhost:8080/api/chats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        userId: currentUserId // Thêm tham số này nếu backend hỗ trợ
      },
      timeout: 10000
    });
    
    // Lọc danh sách chat ở phía client để đảm bảo chỉ lấy chat của người dùng hiện tại
    const allChats = response.data;
    let userChats = allChats;
    
    // Nếu API không lọc sẵn, thì lọc ở client
    if (Array.isArray(allChats)) {
      userChats = allChats.filter(chat => {
        // Kiểm tra xem chatId có chứa ID người dùng hiện tại không
        if (chat.chatId && chat.chatId.includes(currentUserId)) {
          return true;
        }
        
        // Hoặc kiểm tra mảng participants nếu có
        if (chat.participants && Array.isArray(chat.participants)) {
          return chat.participants.includes(currentUserId);
        }
        
        return false;
      });
      
      console.log(`Đã lọc ${userChats.length}/${allChats.length} cuộc trò chuyện của người dùng ${currentUserId}`);
    }
    
    return userChats;
  } catch (error) {
    // Xử lý lỗi
    const errorMessage = error.response?.data;
    console.error("Lỗi khi lấy danh sách chat:", { 
      status: error.response?.status,
      message: errorMessage
    });
    
    // Kiểm tra lỗi Firebase
    if (error.response?.status === 500 && typeof errorMessage === 'string') {
      if (errorMessage.indexOf("Firestore") >= 0 || 
          errorMessage.indexOf("Credentials") >= 0 ||
          errorMessage.indexOf("UNAVAILABLE") >= 0) {
        console.error("Phát hiện lỗi xác thực Firebase");
      }
    }
    
    return [];
  }
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
// Update the fetchParticipantInfo function to include the Authorization header
export const fetchParticipantInfo = async (chatId, currentUserId) => {
  try {
    console.log(`Đang lấy thông tin người tham gia cho chat ${chatId} và người dùng ${currentUserId}`);
    
    // Lấy token từ localStorage trước khi sử dụng
    const token = localStorage.getItem("idToken");
    if (!token) {
      console.error("Token không tồn tại khi gọi fetchParticipantInfo");
      return null;
    }
    
    // Kiểm tra tham số đầu vào
    if (!chatId || !currentUserId) {
      console.error("Thiếu tham số cần thiết cho fetchParticipantInfo");
      return null;
    }

    // Trường hợp 1: Thử lấy thông tin qua API chính
    try {
      const response = await axios.get(
        `http://localhost:8080/api/chats/${chatId}/participant`,
        {
          params: { currentUserId },
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: 5000
        }
      );
      
      console.log(`Lấy thông tin người tham gia thành công cho chat ${chatId}:`, response.data);
      return response.data;
    } catch (error) {
      console.log(`API participant gặp lỗi: ${error.message}. Thử cách khác...`);
      
      // Trường hợp 2: Nếu chatId có định dạng userId1_userId2, trích xuất ID người còn lại
      if (chatId.includes('_')) {
        const parts = chatId.split('_');
        // Tìm ID người dùng khác trong chatId
        const otherUserId = parts[0] === currentUserId ? parts[1] : parts[0];
        
        if (otherUserId && otherUserId !== currentUserId) {
          try {
            console.log(`Đang thử lấy thông tin người dùng qua UID: ${otherUserId}`);
            // Sử dụng API /api/user/{uid} mà bạn cung cấp
            const userResponse = await axios.get(
              `http://localhost:8080/api/user/${otherUserId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                },
                timeout: 5000
              }
            );
            
            console.log(`Lấy thông tin người dùng thành công qua UID: ${otherUserId}`, userResponse.data);
            // Đảm bảo thêm id vào dữ liệu trả về nếu API không trả về
            const userData = userResponse.data;
            if (!userData.id) {
              userData.id = otherUserId;
            }
            return userData;
          } catch (userError) {
            // Nếu người dùng không tồn tại hoặc có lỗi khác
            if (userError.response && userError.response.status === 404) {
              console.warn(`Không tìm thấy người dùng với UID ${otherUserId}`);
            } else {
              console.error(`Lỗi khi lấy thông tin người dùng ${otherUserId}:`, userError.message);
            }
            // Không throw lỗi, tiếp tục để trả về thông tin mặc định
          }
        }
      }
    }
    
    // Nếu cả hai cách đều thất bại, trả về thông tin mặc định
    return createDefaultUserInfo(chatId, currentUserId);
  } catch (error) {
    console.error(`Lỗi chung khi lấy thông tin người tham gia:`, error.message);
    return createDefaultUserInfo(chatId, currentUserId);
  }
};

// Hàm helper để tạo thông tin người dùng mặc định
function createDefaultUserInfo(chatId, currentUserId) {
  let displayId = "";
  
  // Cố gắng trích xuất ID người dùng từ chatId nếu có thể
  if (chatId.includes('_')) {
    const parts = chatId.split('_');
    displayId = parts[0] === currentUserId ? parts[1] : parts[0];
    displayId = displayId.substring(0, 8); // Lấy 8 ký tự đầu để hiển thị
  } else {
    displayId = "unknown";
  }
  
  return {
    firstName: "Người dùng",
    lastName: displayId,
    id: displayId,
    email: `user-${displayId}@example.com`,
    isDefault: true // Đánh dấu đây là thông tin mặc định
  };
}
// Thêm hàm này vào file chatService.js
export const getUserByUid = async (uid) => {
  try {
    if (!uid) {
      console.error("UID không được cung cấp cho getUserByUid");
      return null;
    }
    
    const token = localStorage.getItem("idToken");
    if (!token) {
      console.error("Token không tồn tại khi gọi getUserByUid");
      return null;
    }
    
    console.log(`Đang lấy thông tin người dùng với UID: ${uid}`);
    const response = await axios.get(
      `http://localhost:8080/api/user/${uid}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 5000
      }
    );
    
    console.log(`Lấy thông tin người dùng thành công:`, response.data);
    // Đảm bảo thêm ID vào kết quả
    const userData = response.data;
    if (!userData.id) {
      userData.id = uid;
    }
    return userData;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn(`Không tìm thấy người dùng với UID ${uid}`);
    } else {
      console.error(`Lỗi khi lấy thông tin người dùng ${uid}:`, error.message);
    }
    return null;
  }
  function createDefaultUserInfo(chatId, currentUserId) {
    // Trích xuất ID để sử dụng làm tên hiển thị
    let displayId = chatId;
    if (chatId.includes("_")) {
      const parts = chatId.split('_');
      displayId = parts[0] === currentUserId ? parts[1] : parts[0];
    }
    
    // Tạo thông tin người dùng mặc định
    return {
      firstName: "Người dùng",
      lastName: displayId.substring(0, 5),
      email: `${displayId.substring(0, 5)}@example.com`,
      id: displayId,
      isDefault: true
    };
  }
};
// Hàm tạo thông tin người dùng mặc định
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