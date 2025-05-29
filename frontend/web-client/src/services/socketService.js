import io from 'socket.io-client';

// Export socket instance so it can be imported directly
let socket;
export { socket };

let messageCallbacks = [];
let chatUpdateCallbacks = [];
let messageReadCallbacks = [];
let userLoginCallbacks = [];
let userStatusCallbacks = [];
let groupNotificationCallbacks = [];
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
    });    // Connection events
    socket.on('connect', () => {
      console.log('Socket.IO kết nối thành công với id:', socket.id);
      connectionAttempts = 0;
      currentPortIndex = 0;
      
      // Authenticate with the backend first
      const token = localStorage.getItem('idToken');
      if (token) {
        console.log('Sending authentication to backend...');
        socket.emit('authenticate', { token: token });
      } else {
        console.error('No authentication token found in localStorage');
      }
    });    // Listen for authentication response
    socket.on('authenticated', (response) => {
      console.log('Authentication response received:', response);
      if (response.success) {
        console.log('✅ Socket authentication successful for user:', response.userId);
        console.log('🔗 Socket is now ready to receive group_created events');
        
        // After successful authentication, the backend will automatically join the user to their room
        // No need to emit additional events here
        console.log('User authenticated and ready to receive events');
      } else {
        console.error('❌ Socket authentication failed:', response.error);
      }
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
    });    // Listen for user registration confirmation
    socket.on('user_registered', (data) => {
      console.log('Xác nhận đăng ký người dùng:', data);
    });

    // Listen for user login notifications
    socket.on('user_login_notification', (data) => {
      console.log('Thông báo người dùng đăng nhập:', data);
      userLoginCallbacks.forEach(callback => callback(data));
    });    // Listen for user status changes (online/offline)
    socket.on('user_status_changed', (data) => {
      console.log('=== USER STATUS CHANGED EVENT RECEIVED ===');
      console.log('Event data:', data);
      console.log('Number of registered callbacks:', userStatusCallbacks.length);
      userStatusCallbacks.forEach((callback, index) => {
        console.log(`Calling callback ${index + 1}/${userStatusCallbacks.length}`);
        callback(data);
      });
      console.log('✓ All user status callbacks processed');
    });

    // Listen for online users list (sent when user connects)
    socket.on('online_users', (onlineUsersList) => {
      console.log('=== ONLINE USERS LIST RECEIVED ===');
      console.log('Online users:', onlineUsersList);
      console.log('Number of online users:', onlineUsersList.length || onlineUsersList.size || 0);
      
      // Create a status change event for each online user
      if (Array.isArray(onlineUsersList)) {
        onlineUsersList.forEach(userId => {
          console.log(`Processing online user: ${userId}`);
          userStatusCallbacks.forEach(callback => {
            callback({
              userId: userId,
              status: 'online',
              timestamp: Date.now(),
              source: 'initial_load'
            });
          });
        });
      }
      console.log('✓ All online users processed');
    });

    // Listen for general user login events
    socket.on('user_login', (data) => {
      console.log('Sự kiện đăng nhập người dùng:', data);
      userLoginCallbacks.forEach(callback => callback(data));
    });    // Listen for group_created events
    socket.on('group_created', (data) => {
      console.log('=== GROUP CREATED EVENT RECEIVED ===');
      console.log('Event data:', data);
      console.log('Current user from query:', userId);
      console.log('Number of registered group notification callbacks:', groupNotificationCallbacks.length);
      console.log('Number of registered chat update callbacks:', chatUpdateCallbacks.length);
      
      // Trigger group notification callbacks first (for notifications)
      groupNotificationCallbacks.forEach((callback, index) => {
        console.log(`Calling group notification callback ${index + 1}/${groupNotificationCallbacks.length}`);
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in group notification callback ${index + 1}:`, error);
        }
      });
      
      // Then trigger chat update callbacks to refresh the chat list
      chatUpdateCallbacks.forEach((callback, index) => {
        console.log(`Calling chat update callback ${index + 1}/${chatUpdateCallbacks.length}`);
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in chat update callback ${index + 1}:`, error);
        }
      });
      console.log('✓ All group created callbacks processed');
    });

    // Listen for typing indicators
    socket.on('typing_indicator', (data) => {
      console.log('Typing indicator received:', data);
      typingIndicatorCallbacks.forEach(callback => callback(data));
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
    socket.emit('join_chat', chatId);
  } else {
    console.warn('Socket chưa kết nối, không thể tham gia phòng');
  }
};

export const leaveChatRoom = (chatId) => {
  if (socket && socket.connected) {
    console.log(`Rời phòng chat: ${chatId}`);
    socket.emit('leave_chat', chatId);
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

export const onUserLogin = (callback) => {
  userLoginCallbacks.push(callback);
  return () => {
    userLoginCallbacks = userLoginCallbacks.filter(cb => cb !== callback);
  };
};

export const onUserStatusChange = (callback) => {
  userStatusCallbacks.push(callback);
  return () => {
    userStatusCallbacks = userStatusCallbacks.filter(cb => cb !== callback);
  };
};

export const onGroupNotification = (callback) => {
  console.log('SocketService: Registering group notification callback');
  console.log('Current number of group notification callbacks:', groupNotificationCallbacks.length);
  groupNotificationCallbacks.push(callback);
  console.log('New number of group notification callbacks:', groupNotificationCallbacks.length);
  return () => {
    console.log('SocketService: Unregistering group notification callback');
    groupNotificationCallbacks = groupNotificationCallbacks.filter(cb => cb !== callback);
    console.log('Number of group notification callbacks after removal:', groupNotificationCallbacks.length);
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

// Emit user status to server
export const emitUserStatus = (userId, status) => {
  console.log('=== EMITTING USER STATUS ===');
  console.log('Socket connected:', socket && socket.connected);
  console.log('User ID:', userId);
  console.log('Status:', status);
  
  if (socket && socket.connected) {
    const statusData = {
      userId: userId,
      status: status,
      timestamp: new Date().toISOString()
    };
    console.log('Sending status data:', statusData);
    socket.emit('user_status', statusData);
    console.log('✓ User status emitted successfully');
  } else {
    console.warn('✗ Socket not connected, cannot emit user status');
    console.log('Socket state:', socket ? 'exists but not connected' : 'socket is null');
  }
};

// Emit typing start to server
export const emitTypingStart = (chatId) => {
  if (socket && socket.connected) {
    console.log(`Emitting typing start for chat: ${chatId}`);
    socket.emit('typing_start', {
      chatId: chatId,
      timestamp: new Date().toISOString()
    });
  } else {
    console.warn('Socket not connected, cannot emit typing start');
  }
};

// Emit typing end to server
export const emitTypingEnd = (chatId) => {
  if (socket && socket.connected) {
    console.log(`Emitting typing end for chat: ${chatId}`);
    socket.emit('typing_end', {
      chatId: chatId,
      timestamp: new Date().toISOString()
    });
  } else {
    console.warn('Socket not connected, cannot emit typing end');
  }
};

// Callback arrays for typing indicators
let typingIndicatorCallbacks = [];

// Listen for typing indicators
export const onTypingIndicator = (callback) => {
  typingIndicatorCallbacks.push(callback);
  return () => {
    typingIndicatorCallbacks = typingIndicatorCallbacks.filter(cb => cb !== callback);
  };
};