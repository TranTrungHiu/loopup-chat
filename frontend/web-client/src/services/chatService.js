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
    
    // Lấy danh sách chat từ API
    const allChats = response.data;
    console.log("Tất cả cuộc trò chuyện từ API:", allChats);
    
    if (!Array.isArray(allChats)) {
      console.error("Dữ liệu nhận được từ API không phải là một mảng:", allChats);
      return [];
    }
    
    if (allChats.length === 0) {
      console.log("API trả về danh sách trống");
    }
    
    // Lọc chats dựa trên ID người dùng - giữ lại tất cả chat của người dùng
    const userChats = allChats.filter(chat => {
      // Kiểm tra chatId chứa ID người dùng hiện tại
      const isChatIdMatch = chat.chatId && chat.chatId.includes(currentUserId);
      
      // Kiểm tra mảng participants chứa ID người dùng hiện tại
      const isParticipantMatch = chat.participants && 
                                Array.isArray(chat.participants) && 
                                chat.participants.includes(currentUserId);
      
      return isChatIdMatch || isParticipantMatch;
    });
    
    console.log(`Đã tìm thấy ${userChats.length}/${allChats.length} cuộc trò chuyện của người dùng ${currentUserId}`);
    
    // Trả về tất cả chat của người dùng, không lọc dựa trên tin nhắn
    return userChats;
  } catch (error) {
    // Xử lý lỗi
    console.error("Lỗi khi lấy danh sách chat:", error);
    
    if (error.response) {
      console.error("Chi tiết lỗi:", { 
        status: error.response.status,
        data: error.response.data
      });
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
  try {
    console.log(`Đang gọi API để lấy tin nhắn cho chat: ${chatId}`);
    
    if (!chatId) {
      console.error("fetchMessages được gọi mà không có chatId");
      return [];
    }
    
    if (!token) {
      console.error("fetchMessages được gọi mà không có token");
      return [];
    }
    
    const response = await axios.get(
      `http://localhost:8080/api/messages/${chatId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000 // 10 giây timeout
      }
    );
    
    // Kiểm tra dữ liệu trả về
    const messages = response.data;
    console.log(`Nhận được ${Array.isArray(messages) ? messages.length : 0} tin nhắn cho chat ${chatId}`);
    
    if (Array.isArray(messages)) {
      // Kiểm tra và log một số tin nhắn đầu tiên để debug
      if (messages.length > 0) {
        console.log("Mẫu tin nhắn đầu tiên:", messages[0]);
      }
      return messages;
    } else {
      console.error("API trả về dữ liệu không phải là mảng:", messages);
      return [];
    }
  } catch (error) {
    console.error(`Lỗi khi lấy tin nhắn cho chat ${chatId}:`, error);
    if (error.response) {
      console.error("Chi tiết phản hồi lỗi:", {
        status: error.response.status,
        data: error.response.data
      });
    }
    return [];
  }
};

// Gửi tin nhắn
export const sendMessage = async (chatId, sender, message, token, replyTo) => {
  const payload = {
    chatId,
    sender,
    message,
  };
  if (replyTo) {
    payload.replyTo = replyTo;
  }
  const response = await axios.post(
    `http://localhost:8080/api/messages`,
    payload,
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

// Đánh dấu tin nhắn đã đọc
export const markMessageAsRead = async (messageId, userId, token) => {
  try {
    console.log(`Đánh dấu tin nhắn ${messageId} đã đọc bởi người dùng ${userId}`);
    
    if (!messageId || !userId) {
      console.error("messageId hoặc userId không được để trống");
      return { status: "error", message: "messageId hoặc userId không được để trống" };
    }
    
    const response = await axios.post(
      `http://localhost:8080/api/messages/${messageId}/read`,
      {
        userId
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Không coi 404 là lỗi - để backend xử lý và cho phép tiếp tục
        validateStatus: function (status) {
          // Chấp nhận mã trạng thái 200-299 và 404
          return (status >= 200 && status < 300) || status === 404;
        }
      }
    );
    
    // Nếu là lỗi 404, trả về phản hồi thành công giả
    if (response.status === 404) {
      console.log(`Tin nhắn ${messageId} không tồn tại, nhưng tiếp tục xử lý như bình thường`);
      return { 
        status: "success", 
        message: "Tin nhắn không tồn tại nhưng đã được xử lý" 
      };
    }
    
    console.log('Đánh dấu tin nhắn đã đọc thành công:', response.data);
    return response.data;
  } catch (error) {
    // Chỉ log lỗi trong trường hợp không phải 404
    if (error.response && error.response.status !== 404) {
      console.error(`Lỗi khi đánh dấu tin nhắn ${messageId} đã đọc:`, error);
      console.error("Chi tiết phản hồi lỗi:", error.response);
    } else {
      // Log lỗi khác không liên quan đến phản hồi HTTP
      console.error(`Lỗi không xác định khi đánh dấu tin nhắn đã đọc:`, error.message);
    }
    
    // Luôn trả về kết quả thành công giả để không làm gián đoạn trải nghiệm người dùng
    return { 
      status: "handled_error", 
      message: "Xử lý lỗi đánh dấu đã đọc một cách êm thấm" 
    };
  }
};