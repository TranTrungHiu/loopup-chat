import io from 'socket.io-client';

// Export socket instance so it can be imported directly
let socket;
export { socket };

let messageCallbacks = [];
let chatUpdateCallbacks = [];
let messageReadCallbacks = [];
let connectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;

// Array of fallback ports to try if the main port fails - ưu tiên port 9090
const FALLBACK_PORTS = [9090, 9092, 8080, 8085, 3000];
let currentPortIndex = 0;

// Get server URL from environment variable or use default with fallbacks
const getSocketServerUrl = () => {
  // First try environment variable
  if (process.env.REACT_APP_SOCKET_SERVER_URL) {
    return process.env.REACT_APP_SOCKET_SERVER_URL;
  }
  
  // Default fallback URLs with current port from fallback array
  const port = FALLBACK_PORTS[currentPortIndex];
  return window.location.hostname === 'localhost' 
    ? `http://${window.location.hostname}:${port}`
    : `${window.location.protocol}//${window.location.hostname}:${port}`;
};

// Try next available port
const tryNextPort = () => {
  if (currentPortIndex < FALLBACK_PORTS.length - 1) {
    currentPortIndex++;
    console.log(`Đang thử cổng tiếp theo: ${FALLBACK_PORTS[currentPortIndex]}`);
    return true;
  }
  console.error("Đã thử tất cả các cổng nhưng không thành công");
  return false;
};

export const connectSocket = (userId) => {
  if (socket && socket.connected) {
    console.log('Socket đã kết nối, sử dụng lại kết nối');
    return socket;
  }

  try {
    const serverUrl = getSocketServerUrl();
    console.log(`Kết nối đến Socket.IO server tại: ${serverUrl}`);
    
    // Đóng socket cũ nếu có
    if (socket) {
      socket.close();
      socket = null;
    }
    
    // Socket.IO v2.x configuration - các tùy chọn nâng cao để xử lý lỗi
    socket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
      timeout: 10000,
      transports: ['websocket', 'polling'], // Thử websocket trước, rồi mới dùng polling
      forceNew: true, // Luôn tạo kết nối mới để tránh lỗi
      autoConnect: true,
      query: { userId: userId } // Gửi userId qua query string
    });

    // Connection events
    socket.on('connect', () => {
      console.log('Socket.IO kết nối thành công với id:', socket.id);
      connectionAttempts = 0;
      currentPortIndex = 0;
      
      // Đăng ký người dùng và tham gia phòng
      socket.emit('register_user', userId);
      socket.emit('join_room', `user_${userId}`);
    });

    socket.on('connect_error', (error) => {
      connectionAttempts++;
      console.error(`Lỗi kết nối Socket.IO (lần thử ${connectionAttempts}/${MAX_RECONNECTION_ATTEMPTS}):`, error);
      
      // Nếu đã thử quá số lần cho phép, thử cổng khác
      if (connectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
        console.error('Đã đạt số lần kết nối tối đa, thử cổng tiếp theo');
        if (tryNextPort()) {
          connectionAttempts = 0;
          if (socket) {
            socket.disconnect();
          }
          // Đợi một chút trước khi kết nối lại
          setTimeout(() => {
            connectSocket(userId);
          }, 500);
        } else {
          console.error('Tất cả các cổng đều thất bại. Vui lòng kiểm tra trạng thái server.');
        }
      }
    });

    // Lắng nghe sự kiện lỗi từ server
    socket.on('error', (errorData) => {
      console.error('Lỗi từ server Socket.IO:', errorData);
    });

    // Message events
    socket.on('new_message', (message) => {
      console.log('Nhận tin nhắn mới:', message);
      messageCallbacks.forEach(callback => callback(message));
    });

    socket.on('chat_updated', (data) => {
      console.log('Cuộc trò chuyện được cập nhật:', data);
      chatUpdateCallbacks.forEach(callback => callback(data));
    });

    socket.on('message_read', (data) => {
      console.log('Sự kiện tin nhắn đã đọc:', data);
      messageReadCallbacks.forEach(callback => callback(data));
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket.IO đã ngắt kết nối: ${reason}`);
      
      if (reason === 'io server disconnect' || reason === 'transport close') {
        console.log('Server ngắt kết nối, đang thử kết nối lại');
        
        // Đợi 1 giây trước khi kết nối lại
        setTimeout(() => {
          socket.connect();
        }, 1000);
      }
    });

    // Connection events
    socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket.IO đã kết nối lại sau ${attemptNumber} lần thử`);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket.IO đang thử kết nối lại lần ${attemptNumber}`);
    });

    socket.on('reconnect_error', (error) => {
      console.error('Socket.IO lỗi khi kết nối lại:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('Socket.IO không thể kết nối lại sau tất cả các lần thử');
      if (tryNextPort()) {
        connectionAttempts = 0;
        if (socket) {
          socket.disconnect();
        }
        // Đợi một chút trước khi kết nối lại
        setTimeout(() => {
          connectSocket(userId);
        }, 500);
      }
    });

    // Listen for connection status confirmation from backend
    socket.on('connection_status', (data) => {
      console.log('Nhận trạng thái kết nối từ server:', data);
    });

    // Listen for user registration confirmation
    socket.on('user_registered', (data) => {
      console.log('Xác nhận đăng ký người dùng:', data);
    });

    return socket;
  } catch (error) {
    console.error('Lỗi khởi tạo kết nối Socket.IO:', error);
    return null;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    console.log('Socket.IO đã ngắt kết nối thủ công');
  }
};

export const joinChatRoom = (chatId) => {
  if (socket && socket.connected) {
    console.log(`Tham gia phòng chat: ${chatId}`);
    socket.emit('join_room', chatId);
  } else {
    console.warn('Socket chưa kết nối, không thể tham gia phòng');
  }
};

export const leaveChatRoom = (chatId) => {
  if (socket && socket.connected) {
    console.log(`Rời phòng chat: ${chatId}`);
    socket.emit('leave_room', chatId);
  } else {
    console.warn('Socket chưa kết nối, không thể rời phòng');
  }
};

export const onNewMessage = (callback) => {
  messageCallbacks.push(callback);
  return () => {
    messageCallbacks = messageCallbacks.filter(cb => cb !== callback);
  };
};

export const onChatUpdated = (callback) => {
  chatUpdateCallbacks.push(callback);
  return () => {
    chatUpdateCallbacks = chatUpdateCallbacks.filter(cb => cb !== callback);
  };
};

export const onMessageRead = (callback) => {
  messageReadCallbacks.push(callback);
  return () => {
    messageReadCallbacks = messageReadCallbacks.filter(cb => cb !== callback);
  };
};

// Add direct function to emit message read events
export const emitMessageRead = (messageId, userId, chatId) => {
  if (socket && socket.connected) {
    const readEvent = {
      messageId: messageId,
      userId: userId,
      chatId: chatId,
      timestamp: new Date().toISOString()
    };
    socket.emit('message_read', readEvent);
    console.log('Socket.IO: Đã gửi thông báo message_read cho tin nhắn', messageId);
    return true;
  } else {
    console.warn('Socket.IO: Không thể gửi thông báo message_read vì socket chưa kết nối');
    return false;
  }
};

// Add a manual reconnection method that users can trigger
export const reconnectSocket = (userId) => {
  console.log('Đang cố gắng kết nối lại Socket.IO thủ công');
  disconnectSocket();
  connectionAttempts = 0;
  currentPortIndex = 0;
  return connectSocket(userId);
};