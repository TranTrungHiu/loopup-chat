import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import "./styles/Home.css";
import "./styles/AccountModal.css"; // Import CSS mới cho modal thông tin tài khoản
import Toast, { showToast } from "../component/Toast";
import { toast, ToastContainer, Zoom } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Button,
  IconButton,
  TextField,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Paper,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import ChatHeader from "../component/ChatHeader";
import MessageItem from "../component/MessageItem";
import {
  FaCog,
  FaUserPlus,
  FaUsers,
  FaVideo,
  FaInfoCircle,
  FaSyncAlt,
  FaComments,
  FaUserFriends,
  FaSearch,
  FaPencilAlt,
  FaUser,
  FaSignOutAlt,
  FaFileAlt,
  FaSmile,
  FaImage,
  FaCamera,
  FaPhoneAlt,
  FaBell,
  FaTimes,
  FaCheck,
  FaEnvelope,
  FaSpinner,
  FaExclamationCircle,
} from "react-icons/fa";
import { BsSendFill, BsChatDots, BsPersonPlus } from "react-icons/bs";
import { BiSearch, BiMessageRounded } from "react-icons/bi";
import { MdVideoCall, MdOutlineInfo } from "react-icons/md";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import CreateGroupModal from "../component/CreateGroupModal";
import InformationChat from "../component/InformationChat";
import FriendTab from "../component/FriendTab";
import InviteTab from "../component/InviteTab";
import FriendList from "../component/FriendList";
import FindFriendModal from "../component/FindFriendModal";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import {
  fetchChats,
  fetchMessages,
  fetchParticipantInfo,
  sendMessage,
  markMessageAsRead,
  handleLogout as chatServiceLogout,
} from "../services/chatService";
import {
  connectSocket,
  disconnectSocket,
  joinChatRoom,
  leaveChatRoom,
  onNewMessage,
  onChatUpdated,
  onMessageRead,
  onUserLogin,
  onUserStatusChange,
  onTypingIndicator,
  emitMessageRead,
  emitUserStatus,
  emitTypingStart,
  emitTypingEnd,
} from "../services/socketService";
import ChatList from "../component/ChatList";
import VideoCall from "../component/VideoCall";
import TypingIndicator from "../component/TypingIndicator";
Modal.setAppElement("#root");

const Home = () => {
  const [chatInfor, setChatInfor] = useState(false);
  const [friendList, setFriendList] = useState([]);
  const [showFriends, setShowFriends] = useState(false);
  const uid = localStorage.getItem("uid");
  const token = localStorage.getItem("idToken");
  const [tabs, setTabs] = useState("");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState([]);
  const [firebaseConnectionError, setFirebaseConnectionError] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [participantsInfo, setParticipantsInfo] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // Track all online users globally

  // Helper function to check if a user is online
  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.has(userId);
    },
    [onlineUsers]
  );
  // Memoized enhanced participant info that updates when onlineUsers or participantsInfo changes
  const enhancedParticipantsInfo = useMemo(() => {
    console.log("=== RECALCULATING ENHANCED PARTICIPANTS INFO ===");
    console.log("participantsInfo keys:", Object.keys(participantsInfo));
    console.log("participantsInfo:", participantsInfo);
    console.log("onlineUsers size:", onlineUsers.size);
    console.log("onlineUsers:", Array.from(onlineUsers));

    const enhanced = { ...participantsInfo };

    // Update online status for all participants based on current onlineUsers
    Object.keys(enhanced).forEach((chatId) => {
      if (enhanced[chatId] && enhanced[chatId].uid) {
        const wasOnline = enhanced[chatId].isOnline;
        const isOnlineNow = isUserOnline(enhanced[chatId].uid);

        console.log(`Checking user ${enhanced[chatId].uid} in chat ${chatId}:`);
        console.log(`  - Was online: ${wasOnline}`);
        console.log(`  - Is online now: ${isOnlineNow}`);
        console.log(
          `  - onlineUsers has this user: ${onlineUsers.has(
            enhanced[chatId].uid
          )}`
        );

        enhanced[chatId] = {
          ...enhanced[chatId],
          isOnline: isOnlineNow,
        };

        if (wasOnline !== isOnlineNow) {
          console.log(
            `✓ Status changed for ${enhanced[chatId].uid} in chat ${chatId}: ${wasOnline} -> ${isOnlineNow}`
          );
        } else {
          console.log(
            `- No status change for ${enhanced[chatId].uid} in chat ${chatId}: still ${isOnlineNow}`
          );
        }
      }
    });

    console.log("Final enhanced participants info:", enhanced);
    console.log("=== END ENHANCED PARTICIPANTS INFO CALCULATION ===");

    return enhanced;
  }, [participantsInfo, onlineUsers, isUserOnline]);
  const [currentChat, setCurrentChat] = useState(null);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState(null);
  const [showFriendSidebar, setShowFriendSidebar] = useState(false);
  const [isFindFriendModalOpen, setIsFindFriendModalOpen] = useState(false);

  // Typing indicator states
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const navigate = useNavigate();

  // xử lý emoji
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // Hàm xử lý khi chọn emoji
  const handleEmojiClick = (emojiObject) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
  };
  //Xử lý gửi hình ảnh
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatId", currentChat.chatId);
      formData.append("sender", uid);
      formData.append("mediaType", "image");

      const response = await fetch(
        "http://localhost:8080/api/messages/upload-media",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Không thể gửi ảnh");
      }

      const data = await response.json();
      console.log("Ảnh đã được gửi thành công:", data);
      // Tin nhắn sẽ được cập nhật thông qua Socket.IO, không cần thêm vào state
    } catch (err) {
      console.error("Lỗi khi gửi ảnh:", err);
      alert("Không thể gửi ảnh, vui lòng thử lại.");
    }
  };

  //Xử lý gửi file
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Kiểm tra kích thước file (giới hạn 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        toast.error(`File quá lớn. Giới hạn tối đa là 10MB.`);
        return;
      }

      // Lấy phần mở rộng của file
      const extension = file.name.split(".").pop().toLowerCase();

      // Kiểm tra phần mở rộng file được hỗ trợ
      const supportedExtensions = [
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
        "txt",
        "zip",
        "rar",
      ];
      if (!supportedExtensions.includes(extension)) {
        toast.warning(
          `Loại file ${extension} không được hỗ trợ. Hãy dùng: ${supportedExtensions.join(
            ", "
          )}`
        );
        return;
      }

      console.log(
        `Bắt đầu tải lên file: ${file.name} (${file.type}), kích thước: ${file.size} bytes`
      );
      toast.info(`Đang tải lên ${file.name}...`);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatId", currentChat.chatId);
      formData.append("sender", uid);
      formData.append("mediaType", "document");
      // Thêm tên file và kích thước
      formData.append("fileName", file.name);
      formData.append("fileSize", file.size);

      const response = await fetch(
        "http://localhost:8080/api/messages/upload-media",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", response.status, errorText);
        throw new Error(
          `Không thể gửi file: ${response.status} ${errorText || ""}`
        );
      }

      const data = await response.json();
      console.log("File đã được gửi thành công:", data);
      toast.success(`Đã gửi file ${file.name} thành công`);
    } catch (err) {
      console.error("Lỗi khi gửi file:", err);
      toast.error(err.message || "Không thể gửi file, vui lòng thử lại.");
    }
  };
  // Video call states
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const peerConnection = useRef(null);
  const socket = useRef(null);
  const pendingCandidates = useRef([]);

  // State để theo dõi audio
  const [audio, setAudio] = useState(null);

  // useEffect để khởi tạo audio object nhưng không phát ngay
  useEffect(() => {
    console.log("Incoming call state:", incomingCall);
    if (incomingCall && !audio) {
      try {
        const audioObj = new Audio("/mp3/ringtone.mp3");
        setAudio(audioObj);
      } catch (err) {
        console.error("Error creating Audio object:", err);
      }
    }
    // Cleanup audio khi incomingCall bị xóa
    return () => {
      if (audio && incomingCall) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [incomingCall, audio]);

  // Hàm phát âm thanh khi có tương tác người dùng
  const playRingtone = () => {
    if (audio) {
      audio.play().catch((err) => {
        console.error("Audio playback error:", err);
        if (err.name === "NotSupportedError") {
          console.error(
            "File format not supported or file not found. Ensure /mp3/ringtone.mp3 exists in public folder."
          );
        } else if (err.name === "NotAllowedError") {
          console.error(
            "Autoplay blocked. User interaction may be required before playing audio."
          );
        }
      });
    }
  };

  const iceServers = [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ];

  const waitForWebSocket = (timeout = 10000) => {
    return new Promise((resolve, reject) => {
      if (socket.current && socket.current.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }
      const startTime = Date.now();
      const check = setInterval(() => {
        if (socket.current.readyState === WebSocket.OPEN) {
          clearInterval(check);
          resolve();
        } else if (Date.now() - startTime >= timeout) {
          clearInterval(check);
          reject(new Error("WebSocket connection timeout"));
        }
      }, 100);
    });
  };

  useEffect(() => {
    if (!token) {
      console.log("Không tìm thấy token, chuyển hướng đến trang đăng nhập");
      navigate("/");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/user/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok && response.status === 401) {
          console.warn("Token không còn hợp lệ, đăng xuất và chuyển hướng");
          await signOut(auth);
          localStorage.clear();
          navigate("/");
        } else if (response.ok) {
          const data = await response.json();
          setUserInfo(data);
        }
      } catch (error) {
        console.error("Lỗi khi xác minh token:", error);
      }
    };

    verifyToken();
  }, [token, navigate]);

  useEffect(() => {
    if (isAccountModalOpen && uid) {
      fetch(`http://localhost:8080/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setUserInfo(data))
        .catch((err) => console.error("Lỗi khi lấy user info:", err));
    }
  }, [isAccountModalOpen, uid, token]);

  const loadChats = useCallback(async () => {
    setIsLoadingChats(true);
    setChatError(null);

    try {
      if (!token) {
        console.log("No token available, skipping chat load");
        setIsLoadingChats(false);
        return;
      }

      try {
        await axios.get(`http://localhost:8080/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (profileError) {
        console.error("Profile check failed:", profileError.response?.data);
        if (profileError.response?.status === 500) {
          const errorData = profileError.response?.data || "";
          if (
            typeof errorData === "string" &&
            (errorData.includes("Firestore") ||
              errorData.includes("Credentials failed") ||
              errorData.includes("UNAVAILABLE"))
          ) {
            setFirebaseConnectionError(true);
            throw new Error(
              "Lỗi xác thực Firebase. Vui lòng liên hệ quản trị viên hoặc thử đăng nhập lại."
            );
          }
        }
      }

      const chatList = await fetchChats(token);
      setChats(Array.isArray(chatList) ? chatList : []);

      if (Array.isArray(chatList) && chatList.length > 0) {
        const participantMap = {};
        for (const chat of chatList) {
          try {
            const info = await fetchParticipantInfo(chat.chatId, uid);
            if (info) {
              participantMap[chat.chatId] = info;
            }
          } catch (err) {
            console.error(
              `Error getting participant for chat ${chat.chatId}:`,
              err
            );
          }
        }
        setParticipantsInfo(participantMap);
      }
    } catch (err) {
      console.error("Error loading chat list:", err);
      setChatError(err.message || "Không thể tải danh sách chat");
    } finally {
      setIsLoadingChats(false);
    }
  }, [token, uid]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (tabs === "Chat") {
      loadChats();
    }
  }, [tabs, loadChats]);
  const handleLogout = async () => {
    // Use the logout function from chatService which properly emits offline status
    await chatServiceLogout(navigate);
  };

  const fetchFriends = async () => {
    if (!uid) {
      console.error("UID không tồn tại trong localStorage.");
      return;
    }
    try {
      const res = await fetch(`http://localhost:8080/api/friends/list/${uid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`Lỗi HTTP: ${res.status}`);
      }
      const data = await res.json();
      setFriendList(Array.isArray(data) ? data : []);
      setShowFriends(true);
    } catch (err) {
      console.error("Lỗi lấy danh sách bạn bè:", err);
      setFriendList([]);
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail) return;
    try {
      const res = await fetch(
        `http://localhost:8080/api/user/find?email=${searchEmail}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        setFoundUser(null);
        setShowNotFound(true);
        setTimeout(() => setShowNotFound(false), 3000);
        return;
      }

      const user = await res.json();
      setFoundUser(user);

      const checkRes = await fetch(
        `http://localhost:8080/api/friends/status/${uid}/${user.uid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await checkRes.json();
      setIsFriend(result.status);
    } catch (err) {
      console.error("Lỗi tìm người dùng:", err);
      setFoundUser(null);
      setShowNotFound(true);
      setTimeout(() => setShowNotFound(false), 3000);
    }
  };

  const handleSendRequest = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId1: uid,
          userId2: foundUser.uid,
        }),
      });

      if (!res.ok) {
        const errorMessage = await res.text();
        showToast("error", errorMessage);
        return;
      }

      setIsFriend("pending");
      showToast("success", "Lời mời kết bạn đã được gửi");
    } catch (err) {
      console.error("Lỗi gửi lời mời kết bạn:", err);
      showToast("error", "Không thể gửi lời mời kết bạn, vui lòng thử lại sau");
    }
  };

  const handleStartChat = async (friend) => {
    try {
      const res = await fetch("http://localhost:8080/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user1: uid,
          user2: friend.uid,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error("Lỗi khi tạo hoặc lấy cuộc trò chuyện");
      }

      const chatData = await res.json();
      setTabs("Chat");
      setCurrentChat(chatData);
      setCurrentParticipant(friend);
      setShowFriends(false);
      loadMessages(chatData.chatId);
      showToast(
        "success",
        `Bắt đầu cuộc trò chuyện với ${friend.firstName} ${friend.lastName}`
      );
    } catch (err) {
      console.error("Lỗi khi bắt đầu cuộc trò chuyện:", err);
      showToast(
        "error",
        "Không thể bắt đầu cuộc trò chuyện, vui lòng thử lại sau"
      );
    }
  };

  const handleStartChatFromSidebar = async (friend) => {
    try {
      const res = await fetch("http://localhost:8080/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user1: uid,
          user2: friend.uid,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error("Lỗi khi tạo hoặc lấy cuộc trò chuyện");
      }

      const chatData = await res.json();
      setTabs("Chat");
      setCurrentChat(chatData);
      setCurrentParticipant(friend);
      loadMessages(chatData.chatId);
      loadChats();
      showToast(
        "success",
        `Bắt đầu cuộc trò chuyện với ${friend.firstName} ${friend.lastName}`
      );
    } catch (err) {
      console.error("Lỗi khi bắt đầu cuộc trò chuyện:", err);
      showToast(
        "error",
        "Không thể bắt đầu cuộc trò chuyện, vui lòng thử lại sau"
      );
    }
  };

  const loadMessages = async (chatId) => {
    setIsLoadingMessages(true);
    setMessageError(null);

    try {
      const messagesData = await fetchMessages(chatId, token);
      setMessages(Array.isArray(messagesData) ? messagesData : []);

      // Theo dõi tin nhắn chưa đọc
      unreadMessagesRef.current = messagesData.filter(
        (msg) => msg.sender !== uid && (!msg.readBy || !msg.readBy[uid])
      );

      // Cuộn xuống tin nhắn cuối cùng NGAY LẬP TỨC sau khi tải tin nhắn
      setTimeout(() => scrollToBottom(true), 100);
    } catch (err) {
      console.error("Lỗi khi tải tin nhắn:", err);
      setMessageError("Không thể tải tin nhắn");
    } finally {
      setIsLoadingMessages(false);
    }
  };
  // Tham chiếu để theo dõi việc cuộn xuống cuối cùng
  // Xử lý gửi tin nhắn dựa hoàn toàn vào Socket.IO real-time
  const handleSendMessage = async () => {
    try {
      if (!currentChat || !newMessage.trim()) return;

      const trimmedMessage = newMessage.trim();

      // Stop typing when sending message
      handleTypingEnd();

      setNewMessage(""); // Xóa tin nhắn trong input ngay lập tức

      // Đặt shouldScrollToBottomRef thành true để đảm bảo cuộn xuống dưới khi tin nhắn mới đến
      shouldScrollToBottomRef.current = true;

      // Gửi tin nhắn qua API mà không tạo tin nhắn tạm thời
      // Socket.IO sẽ nhận và xử lý tin nhắn sau khi nó được lưu vào cơ sở dữ liệu
      await sendMessage(currentChat.chatId, uid, trimmedMessage, token);

      // Không cần thêm tin nhắn vào state vì socket sẽ nhận được tin nhắn và cập nhật UI
      console.log("Tin nhắn đã được gửi, đang chờ phản hồi từ socket...");
    } catch (err) {
      console.error("Lỗi khi gửi tin nhắn:", err);
      showToast("error", "Không thể gửi tin nhắn, vui lòng thử lại");
    }
  };

  // Typing indicator functions
  const handleTypingStart = useCallback(() => {
    if (!currentChat || isTyping) return;

    setIsTyping(true);
    emitTypingStart(currentChat.chatId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingEnd();
    }, 3000);
  }, [currentChat, isTyping]);

  const handleTypingEnd = useCallback(() => {
    if (!currentChat || !isTyping) return;

    setIsTyping(false);
    emitTypingEnd(currentChat.chatId);

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [currentChat, isTyping]); // Handle message input change with typing indicators
  const handleMessageInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      const prevValue = newMessage;
      setNewMessage(value);

      // Only trigger typing if user is actually typing (content changed)
      if (value !== prevValue) {
        if (value.trim().length > 0) {
          handleTypingStart();
        } else {
          handleTypingEnd();
        }
      }
    },
    [handleTypingStart, handleTypingEnd, newMessage]
  );

  // Handle key press events for typing indicator
  const handleKeyPress = useCallback(
    (e) => {
      // Only trigger typing on actual character input, not special keys
      if (e.key.length === 1 || e.key === "Backspace" || e.key === "Delete") {
        if (newMessage.trim().length > 0 || e.key.length === 1) {
          handleTypingStart();
        }
      }
    },
    [handleTypingStart, newMessage]
  );

  const handleChatSelect = useCallback(
    async (chat) => {
      setCurrentChat(chat);

      // Đặt cờ shouldScrollToBottomRef thành true để đảm bảo sẽ cuộn xuống cuối cùng
      shouldScrollToBottomRef.current = true;

      if (participantsInfo[chat.chatId]) {
        setCurrentParticipant(participantsInfo[chat.chatId]);

        // Tải tin nhắn trước
        const messagesData = await fetchMessages(chat.chatId, token);

        // Đánh dấu tất cả tin nhắn chưa đọc là đã đọc ngay khi chọn chat
        if (Array.isArray(messagesData)) {
          const unreadMessages = messagesData.filter(
            (msg) => msg.sender !== uid && (!msg.readBy || !msg.readBy[uid])
          );

          console.log(
            `Tự động đánh dấu ${unreadMessages.length} tin nhắn đã đọc khi chọn chat ${chat.chatId}`
          );

          // Cập nhật UI trước để tăng trải nghiệm người dùng
          setMessages(
            messagesData.map((msg) => {
              if (msg.sender !== uid && (!msg.readBy || !msg.readBy[uid])) {
                return {
                  ...msg,
                  readBy: {
                    ...(msg.readBy || {}),
                    [uid]: new Date().toISOString(),
                  },
                };
              }
              return msg;
            })
          );

          // Đánh dấu từng tin nhắn là đã đọc
          unreadMessages.forEach((msg) => {
            if (msg.id) {
              // 1. Gửi sự kiện Socket.IO trực tiếp ngay lập tức để đảm bảo real-time
              emitMessageRead(msg.id, uid, chat.chatId);

              // 2. Lưu trạng thái vào cơ sở dữ liệu
              markMessageAsRead(msg.id, uid, token)
                .then(() => {
                  console.log(
                    `Tin nhắn ${msg.id} được đánh dấu đã đọc khi chọn chat`
                  );
                })
                .catch((err) => {
                  console.error(
                    `Lỗi khi đánh dấu tin nhắn ${msg.id} đã đọc:`,
                    err
                  );
                });
            }
          });
        } else {
          // Nếu không có tin nhắn hoặc lỗi, vẫn hiển thị danh sách rỗng
          setMessages([]);
        }

        return;
      }

      setCurrentParticipant({
        firstName: "Đang tải",
        lastName: "...",
        isLoading: true,
      });

      loadMessages(chat.chatId);

      try {
        const info = await fetchParticipantInfo(chat.chatId, uid);
        if (info) {
          setParticipantsInfo((prev) => ({
            ...prev,
            [chat.chatId]: info,
          }));
          setCurrentParticipant(info);
        } else {
          setCurrentParticipant({
            firstName: "Người dùng",
            lastName: "không xác định",
            isDefault: true,
          });
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin người tham gia:", err);
        setCurrentParticipant({
          firstName: "Người dùng",
          lastName: "không xác định",
          isDefault: true,
        });
      }
    },
    [participantsInfo, uid, token]
  );

  const handleStartChatFromSearch = async (otherUser) => {
    try {
      const res = await fetch("http://localhost:8080/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user1: uid,
          user2: otherUser.uid,
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể tạo hoặc lấy cuộc trò chuyện");
      }

      const chatData = await res.json();
      setTabs("Chat");
      loadChats();
      setCurrentChat(chatData);
      setCurrentParticipant(otherUser);
      loadMessages(chatData.chatId);
      showToast(
        "success",
        `Bắt đầu cuộc trò chuyện với ${otherUser.firstName} ${otherUser.lastName}`
      );
    } catch (error) {
      console.error("Lỗi khi bắt đầu cuộc trò chuyện:", error);
      showToast(
        "error",
        "Không thể bắt đầu cuộc trò chuyện, vui lòng thử lại sau"
      );
    }
  };

  // Video call logic
  useEffect(() => {
    const connectWebSocket = () => {
      socket.current = new WebSocket(
        `ws://localhost:8080/ws/video?userId=${uid}`
      );

      socket.current.onopen = () => {
        console.log("WebSocket connected for user:", uid);
        while (pendingCandidates.current.length > 0) {
          const candidate = pendingCandidates.current.shift();
          socket.current.send(
            JSON.stringify({
              type: "ice-candidate",
              to: currentParticipant?.uid,
              candidate,
            })
          );
        }
      };

      socket.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Raw WebSocket message:", event.data);
        console.log("Parsed WebSocket message:", data);
        switch (data.type) {
          case "video-offer":
            handleReceiveOffer(data);
            break;
          case "video-answer":
            handleReceiveAnswer(data);
            break;
          case "ice-candidate":
            handleReceiveIceCandidate(data);
            break;
          case "call-rejected":
            handleCallRejected(data);
            break;
          default:
            console.warn("Unknown message type:", data.type);
        }
      };

      socket.current.onclose = () => {
        console.log("WebSocket disconnected, retrying in 3s...");
        setTimeout(connectWebSocket, 3000);
      };

      socket.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    };

    connectWebSocket();

    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, [uid]);

  const handleStartVideoCall = async () => {
    console.log("Starting video call to:", currentParticipant);
    if (!currentParticipant?.uid) {
      showToast("warning", "Vui lòng chọn người dùng để gọi video");
      return;
    }

    try {
      await waitForWebSocket();
      const stream = await navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true,
        })
        .catch((err) => {
          console.error("Media access error:", err);
          showToast(
            "error",
            "Không thể truy cập camera hoặc micro. Vui lòng kiểm tra quyền"
          );
          throw err;
        });
      setLocalStream(stream);

      if (peerConnection.current) {
        peerConnection.current.close();
      }
      peerConnection.current = new RTCPeerConnection({ iceServers });

      stream
        .getTracks()
        .forEach((track) => peerConnection.current.addTrack(track, stream));

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          if (socket.current.readyState === WebSocket.OPEN) {
            socket.current.send(
              JSON.stringify({
                type: "ice-candidate",
                to: currentParticipant.uid,
                candidate: event.candidate,
              })
            );
          } else {
            console.log("Storing ICE candidate due to WebSocket not ready");
            pendingCandidates.current.push(event.candidate);
          }
        }
      };

      peerConnection.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      console.log("Sending video-offer to:", currentParticipant.uid);
      socket.current.send(
        JSON.stringify({
          type: "video-offer",
          to: currentParticipant.uid,
          from: uid,
          sdp: offer,
        })
      );

      setIsVideoCall(true);
    } catch (error) {
      console.error("Lỗi khi bắt đầu cuộc gọi video:", error);
      showToast("error", "Không thể bắt đầu cuộc gọi video: " + error.message);
      handleEndCall();
    }
  };

  const handleReceiveOffer = async (data) => {
    console.log("Received offer data:", data);
    if (!data.from || !data.sdp) {
      console.error("Invalid offer data:", data);
      return;
    }

    try {
      // Fetch caller info
      const response = await fetch(
        `http://localhost:8080/api/user/profile/${data.from}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(
          `Không thể lấy thông tin người gọi: ${response.status}`
        );
      }
      const callerInfo = await response.json();
      console.log("Caller info:", callerInfo);
      setCurrentParticipant(callerInfo);
      setIncomingCall({ from: data.from, sdp: data.sdp });
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người gọi:", error);
      setCurrentParticipant({
        uid: data.from,
        firstName: "Người dùng",
        lastName: "không xác định",
        avatarUrl: "/default-avatar.png",
        isDefault: true,
      });
      setIncomingCall({ from: data.from, sdp: data.sdp });
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    try {
      const stream = await navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true,
        })
        .catch((err) => {
          console.error("Media access error:", err);
          showToast(
            "error",
            "Không thể truy cập camera hoặc micro. Vui lòng kiểm tra quyền."
          );
          throw err;
        });
      setLocalStream(stream);

      if (peerConnection.current) {
        peerConnection.current.close();
      }
      peerConnection.current = new RTCPeerConnection({ iceServers });

      stream
        .getTracks()
        .forEach((track) => peerConnection.current.addTrack(track, stream));

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          if (socket.current.readyState === WebSocket.OPEN) {
            socket.current.send(
              JSON.stringify({
                type: "ice-candidate",
                to: incomingCall.from,
                candidate: event.candidate,
              })
            );
          } else {
            console.log("Storing ICE candidate due to WebSocket not ready");
            pendingCandidates.current.push(event.candidate);
          }
        }
      };

      peerConnection.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(incomingCall.sdp)
      );

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.current.send(
        JSON.stringify({
          type: "video-answer",
          to: incomingCall.from,
          from: uid,
          sdp: answer,
        })
      );

      setIsVideoCall(true);
      setIncomingCall(null);
      showToast("success", "Đã kết nối cuộc gọi video");
    } catch (error) {
      console.error("Lỗi khi nhận offer:", error);
      showToast("error", "Lỗi khi xử lý trả lời cuộc gọi: " + error.message);
      handleEndCall();
    }
  };

  const handleCallRejected = (data) => {
    showToast("info", "Cuộc gọi bị từ chối bởi người nhận");
    handleEndCall();
  };

  const handleReceiveAnswer = async (data) => {
    if (!data.sdp) {
      console.error("Invalid answer data:", data);
      return;
    }

    try {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(data.sdp)
      );
      showToast("success", "Đã kết nối cuộc gọi video");
    } catch (error) {
      console.error("Lỗi khi nhận answer:", error);
      showToast("error", "Lỗi khi xử lý trả lời cuộc gọi: " + error.message);
    }
  };

  const handleReceiveIceCandidate = async (data) => {
    if (!data.candidate) {
      console.error("Invalid ICE candidate data:", data);
      return;
    }

    try {
      await peerConnection.current.addIceCandidate(
        new RTCIceCandidate(data.candidate)
      );
    } catch (error) {
      console.error("Lỗi khi nhận ICE candidate:", error);
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      // Gửi thông báo từ chối cuộc gọi đến người gọi
      socket.current.send(
        JSON.stringify({
          type: "call-rejected",
          to: incomingCall.from,
          from: uid,
        })
      );

      // Đóng cửa sổ cuộc gọi đến
      setIncomingCall(null);

      // Dừng âm thanh chuông nếu đang phát
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      showToast("info", "Bạn đã từ chối cuộc gọi");
    }
  };

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      setRemoteStream(null);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    pendingCandidates.current = [];
    setIsVideoCall(false);
    setIncomingCall(null);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };
  // Kết nối Socket.IO khi component được mount
  useEffect(() => {
    if (!uid) return;

    // Kết nối với socket server
    const socket = connectSocket(uid);

    // Note: User status should only be updated on explicit login/logout
    // We don't emit online status here anymore to avoid status changes during normal socket reconnections

    // Đăng ký các sự kiện socket
    const newMessageUnsub = onNewMessage((message) => {
      console.log("New message received:", message);

      // Nếu tin nhắn thuộc cuộc trò chuyện hiện tại, thêm vào danh sách tin nhắn
      if (currentChat && message.chatId === currentChat.chatId) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== message.id),
          message,
        ]);

        // Đánh dấu là tin nhắn đã đọc nếu không phải từ người dùng hiện tại
        // và người dùng đang xem cửa sổ chat này
        if (
          message.sender !== uid &&
          message.id &&
          document.visibilityState === "visible"
        ) {
          console.log(
            `Tự động đánh dấu tin nhắn mới ${message.id} là đã đọc vì người dùng đang mở chat`
          );

          // 1. Gửi sự kiện Socket.IO trực tiếp để người gửi thấy tin nhắn đã được đọc ngay lập tức
          emitMessageRead(message.id, uid, currentChat.chatId);

          // 2. Lưu vào database
          markMessageAsRead(message.id, uid, token)
            .then(() => {
              console.log("Tin nhắn mới tự động được đánh dấu đã đọc");

              // 3. Cập nhật UI để hiển thị trạng thái đã đọc
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.id === message.id
                    ? {
                        ...msg,
                        readBy: {
                          ...(msg.readBy || {}),
                          [uid]: new Date().toISOString(),
                        },
                      }
                    : msg
                )
              );
            })
            .catch((err) =>
              console.error("Error marking new message as read:", err)
            );
        }

        // Cuộn xuống để hiện thị tin nhắn mới
        setTimeout(scrollToBottom, 100);
      }

      // Cập nhật danh sách chat
      loadChats();
    });

    // Xử lý sự kiện cập nhật chat
    const chatUpdatedUnsub = onChatUpdated((data) => {
      console.log("Chat updated:", data);
      loadChats();
    }); // Xử lý sự kiện tin nhắn đã đọc
    const messageReadUnsub = onMessageRead((data) => {
      console.log("Message read event received:", data);

      // Kiểm tra dữ liệu hợp lệ
      if (!data || !data.messageId || !data.userId) {
        console.error("Invalid message_read event data:", data);
        return;
      }

      // Cập nhật trạng thái đọc tin nhắn trong UI ngay lập tức
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id === data.messageId) {
            console.log(
              `Updating read status for message ${msg.id} by user ${data.userId}`
            );
            // Tạo bản sao của đối tượng tin nhắn để không thay đổi trực tiếp state
            const updatedMsg = { ...msg };

            // Khởi tạo readBy nếu chưa tồn tại
            if (!updatedMsg.readBy) {
              updatedMsg.readBy = {};
            }

            // Thêm hoặc cập nhật thông tin người đọc
            updatedMsg.readBy[data.userId] =
              data.timestamp || new Date().toISOString();

            return updatedMsg;
          }
          return msg;
        })
      );
    }); // Xử lý sự kiện đăng nhập người dùng
    const userLoginUnsub = onUserLogin((data) => {
      console.log("User login notification received:", data);

      // Kiểm tra dữ liệu hợp lệ
      if (!data || !data.userId || !data.email) {
        console.error("Invalid user login event data:", data);
        return;
      }

      // Cập nhật trạng thái online cho người dùng trong participantsInfo
      setParticipantsInfo((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((chatId) => {
          if (updated[chatId] && updated[chatId].uid === data.userId) {
            updated[chatId] = {
              ...updated[chatId],
              isOnline: true,
              status: "online",
            };
          }
        });
        return updated;
      });
    }); // Xử lý sự kiện thay đổi trạng thái người dùng (online/offline)
    const userStatusUnsub = onUserStatusChange((data) => {
      console.log("=== USER STATUS CHANGE EVENT RECEIVED ===");
      console.log("Event data:", data);
      console.log(
        "Current participantsInfo keys:",
        Object.keys(participantsInfo)
      );
      console.log("Current onlineUsers size:", onlineUsers.size);
      console.log("Current onlineUsers array:", Array.from(onlineUsers));

      // Kiểm tra dữ liệu hợp lệ
      if (!data || !data.userId || !data.status) {
        console.error("Invalid user status change event data:", data);
        return;
      }

      console.log(
        `Processing: User ${data.userId} status changed to: ${data.status}`
      );

      // Cập nhật danh sách người dùng online toàn cục
      setOnlineUsers((prev) => {
        const newOnlineUsers = new Set(prev);
        if (data.status === "online") {
          newOnlineUsers.add(data.userId);
          console.log(
            `✓ Added user ${data.userId} to online users. New size: ${newOnlineUsers.size}`
          );
        } else {
          newOnlineUsers.delete(data.userId);
          console.log(
            `✓ Removed user ${data.userId} from online users. New size: ${newOnlineUsers.size}`
          );
        }
        console.log("Updated onlineUsers:", Array.from(newOnlineUsers));
        return newOnlineUsers;
      }); // Cập nhật trạng thái trong participantsInfo (cho những user đã có cuộc trò chuyện)
      setParticipantsInfo((prev) => {
        const updated = { ...prev };
        let foundUpdate = false;

        console.log("Searching for user in participantsInfo...");
        Object.keys(updated).forEach((chatId) => {
          if (updated[chatId] && updated[chatId].uid === data.userId) {
            console.log(
              `✓ Found and updating user ${data.userId} in chat ${chatId}: ${data.status}`
            );
            updated[chatId] = {
              ...updated[chatId],
              isOnline: data.status === "online",
              status: data.status,
              lastSeen:
                data.status === "offline"
                  ? new Date().toISOString()
                  : updated[chatId].lastSeen,
            };
            foundUpdate = true;
          }
        });

        if (foundUpdate) {
          console.log("✓ Updated participantsInfo for user:", data.userId);
        } else {
          console.log("⚠ User not found in participantsInfo:", data.userId);
          // If user not found in participantsInfo, but they have a chat with current user,
          // we need to fetch their participant info and update it
          if (data.status === "online") {
            // Find if this user has any chat with current user
            const userChats = chats.filter((chat) => {
              const otherParticipants = chat.participants.filter(
                (p) => p !== uid
              );
              return otherParticipants.includes(data.userId);
            });

            if (userChats.length > 0) {
              console.log(
                `User ${data.userId} has ${userChats.length} chats but not in participantsInfo. Fetching info...`
              );
              // Fetch participant info for this user in their chats
              userChats.forEach(async (chat) => {
                try {
                  const participantInfo = await fetchParticipantInfo(
                    chat.chatId,
                    uid,
                    token
                  );
                  if (participantInfo && participantInfo.uid === data.userId) {
                    console.log(
                      `✓ Fetched and updating participant info for ${data.userId} in chat ${chat.chatId}`
                    );
                    setParticipantsInfo((prevInfo) => ({
                      ...prevInfo,
                      [chat.chatId]: {
                        ...participantInfo,
                        isOnline: true,
                        status: "online",
                      },
                    }));
                  }
                } catch (error) {
                  console.error(
                    `Error fetching participant info for ${data.userId}:`,
                    error
                  );
                }
              });
            }
          }
        }

        return updated;
      }); // Cập nhật currentParticipant nếu đang xem chat với người này
      if (currentParticipant && currentParticipant.uid === data.userId) {
        console.log(
          `Updating current participant status: ${data.userId} -> ${data.status}`
        );
        setCurrentParticipant((prev) => ({
          ...prev,
          isOnline: data.status === "online",
          status: data.status,
          lastSeen:
            data.status === "offline"
              ? new Date().toISOString()
              : prev.lastSeen,
        }));
      }

      console.log("✓ User status change processing completed");
    });

    // Xử lý sự kiện typing indicator
    const typingIndicatorUnsub = onTypingIndicator((data) => {
      console.log("Typing indicator received:", data);

      // Kiểm tra dữ liệu hợp lệ và chỉ xử lý nếu đang trong chat hiện tại
      if (
        !data ||
        !data.userId ||
        !data.chatId ||
        !currentChat ||
        data.chatId !== currentChat.chatId
      ) {
        return;
      }

      // Không xử lý typing indicator từ chính user hiện tại
      if (data.userId === uid) {
        return;
      }

      setTypingUsers((prev) => {
        if (data.isTyping) {
          // Thêm user vào danh sách đang typing (nếu chưa có)
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        } else {
          // Xóa user khỏi danh sách đang typing
          return prev.filter((userId) => userId !== data.userId);
        }
      });
    }); // Cleanup khi component bị hủy
    return () => {
      newMessageUnsub();
      chatUpdatedUnsub();
      messageReadUnsub();
      userLoginUnsub();
      userStatusUnsub();
      typingIndicatorUnsub();

      // Note: We don't emit offline status here anymore
      // User status should only change on explicit logout via chatService

      disconnectSocket();
    };
  }, [uid, currentChat, chats, token]);

  // Đánh dấu tin nhắn đã đọc khi người dùng vào hội thoại
  useEffect(() => {
    if (!currentChat || !uid || !token) return;

    // Tham gia phòng chat để nhận các tin nhắn mới
    joinChatRoom(currentChat.chatId);

    // Đánh dấu tất cả tin nhắn chưa đọc là đã đọc
    const unreadMessages = messages.filter(
      (msg) => msg.sender !== uid && (!msg.readBy || !msg.readBy[uid])
    );

    unreadMessages.forEach((msg) => {
      if (msg.id) {
        markMessageAsRead(msg.id, uid, token)
          .then(() => console.log(`Message ${msg.id} marked as read`))
          .catch((err) =>
            console.error(`Error marking message ${msg.id} as read:`, err)
          );
      }
    });

    return () => {
      // Rời khỏi phòng chat khi chuyển sang hội thoại khác
      if (currentChat) {
        leaveChatRoom(currentChat.chatId);
      }
    };
  }, [currentChat, messages, uid, token]);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const chatContentRef = useRef(null);
  const unreadMessagesRef = useRef([]);
  const shouldScrollToBottomRef = useRef(true);

  // Hàm để cuộn xuống tin nhắn cuối cùng
  const scrollToBottom = useCallback((immediate = false) => {
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({
          behavior: immediate ? "auto" : "smooth",
          block: "end",
        });
        console.log(
          "Đã cuộn xuống tin nhắn cuối cùng",
          immediate ? "(ngay lập tức)" : "(mượt mà)"
        );
      } catch (err) {
        console.error("Lỗi khi cuộn tin nhắn:", err);
      }
    }
  }, []);
  // Đánh dấu cần cuộn khi tin nhắn thay đổi
  useEffect(() => {
    if (shouldScrollToBottomRef.current && messages.length > 0) {
      scrollToBottom(true);
      shouldScrollToBottomRef.current = false;
    }
  }, [messages, scrollToBottom]);

  // Debug: Track onlineUsers changes
  useEffect(() => {
    console.log("=== ONLINE USERS STATE CHANGED ===");
    console.log("New onlineUsers:", Array.from(onlineUsers));
    console.log("Size:", onlineUsers.size);
    console.log("=== END ONLINE USERS STATE CHANGE ===");
  }, [onlineUsers]);

  // Debug: Track participantsInfo changes
  useEffect(() => {
    console.log("=== PARTICIPANTS INFO STATE CHANGED ===");
    console.log("New participantsInfo:", participantsInfo);
    console.log("Keys:", Object.keys(participantsInfo));
    console.log("=== END PARTICIPANTS INFO STATE CHANGE ===");
  }, [participantsInfo]);

  // Đánh dấu tất cả tin nhắn chưa đọc là đã đọc khi người dùng nhấn vào ô nhập tin nhắn
  const handleInputFocus = useCallback(() => {
    if (!currentChat || !uid || !token) return;

    const unreadMessages = messages.filter(
      (msg) => msg.sender !== uid && (!msg.readBy || !msg.readBy[uid])
    );

    if (unreadMessages.length > 0) {
      console.log(
        `Đánh dấu ${unreadMessages.length} tin nhắn đã đọc khi nhấn vào input`
      );

      unreadMessages.forEach((msg) => {
        if (msg.id) {
          // Ghi log rõ ràng về việc bắt đầu đánh dấu tin nhắn đã đọc
          console.log(
            `Bắt đầu đánh dấu tin nhắn ${msg.id} đã đọc khi click input`
          );

          // 1. Gửi sự kiện Socket.IO trực tiếp ngay lập tức để đảm bảo real-time
          const socketSent = emitMessageRead(msg.id, uid, currentChat.chatId);
          if (socketSent) {
            console.log(`Đã gửi sự kiện Socket.IO cho tin nhắn ${msg.id}`);
          }

          // 2. Lưu trạng thái vào cơ sở dữ liệu
          markMessageAsRead(msg.id, uid, token)
            .then((response) => {
              console.log(
                `API: Tin nhắn ${msg.id} đã được đánh dấu đã đọc khi nhấn input`,
                response
              );

              // 3. Cập nhật UI để hiển thị trạng thái đã đọc
              setMessages((prevMessages) =>
                prevMessages.map((prevMsg) =>
                  prevMsg.id === msg.id
                    ? {
                        ...prevMsg,
                        readBy: {
                          ...(prevMsg.readBy || {}),
                          [uid]: new Date().toISOString(),
                        },
                      }
                    : prevMsg
                )
              );
            })
            .catch((err) => {
              console.error(`Lỗi khi đánh dấu tin nhắn ${msg.id} đã đọc:`, err);
              // Nếu API gặp lỗi, vẫn cập nhật UI để trải nghiệm người dùng không bị gián đoạn
              setMessages((prevMessages) =>
                prevMessages.map((prevMsg) =>
                  prevMsg.id === msg.id
                    ? {
                        ...prevMsg,
                        readBy: {
                          ...(prevMsg.readBy || {}),
                          [uid]: new Date().toISOString(),
                        },
                      }
                    : prevMsg
                )
              );
            });
        }
      });
    }
  }, [currentChat, uid, token, messages]);

  //Xử lý sau khi rời nhóm chat
  const handleLeaveCurrentChat = () => {
    setCurrentChat(null);
    setTabs("");
  }; // Set user as online when component mounts (only once per browser session)
  useEffect(() => {
    if (!uid) return;

    // Check if we've already emitted online status for this session
    const sessionKey = `online_status_emitted_${uid}`;
    const hasEmittedStatus = sessionStorage.getItem(sessionKey);

    // Add current user to online users immediately (optimistic update)
    setOnlineUsers((prev) => {
      const newOnlineUsers = new Set(prev);
      newOnlineUsers.add(uid);
      return newOnlineUsers;
    });

    // Only emit online status if we haven't done so in this browser session
    if (!hasEmittedStatus) {
      // Add a small delay to ensure all socket event listeners are registered first
      const statusTimeout = setTimeout(() => {
        console.log(
          "Emitting online status for user (first time this session):",
          uid
        );
        emitUserStatus(uid, "online");
        // Mark that we've emitted status for this session
        sessionStorage.setItem(sessionKey, "true");
      }, 500); // 500ms delay to ensure socket is fully connected

      return () => {
        clearTimeout(statusTimeout);
      };
    } else {
      console.log(
        "User status already emitted for this session, skipping:",
        uid
      );
    }

    // Note: We removed automatic offline status on visibility change and beforeunload
    // User will only go offline when they explicitly logout or close the browser completely
  }, [uid]); // Only run when uid changes (i.e., on login)

  // Clear typing users when switching chats
  useEffect(() => {
    setTypingUsers([]);
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [currentChat]);

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="logo">LOOPUP</div>
        <div className="sidebar-icons">
          <div
            className={`icon ${tabs === "Chat" ? "active" : ""}`}
            title="Chat"
            onClick={() => {
              setTabs("Chat");
              setShowFriendSidebar(false);
            }}
          >
            <FaComments size={18} /> <span>Chat</span>
          </div>
          <div
            className={`icon ${tabs === "Friend" ? "active" : ""}`}
            title="Bạn bè"
            onClick={() => {
              setShowFriendSidebar(!showFriendSidebar);
              setShowSettings(false);
              setTabs("Friend");
            }}
          >
            <FaUserFriends size={18} /> <span>Bạn bè</span>
          </div>
          <div
            className={`icon ${tabs === "Invite" ? "active" : ""}`}
            title="Lời mời kết bạn"
            onClick={() => {
              setTabs("Invite");
              setShowFriendSidebar(false);
            }}
          >
            <FaUserPlus size={18} /> <span>Lời mời</span>
          </div>
          <div
            className="icon"
            title="Tìm bạn"
            onClick={() => setIsFindFriendModalOpen(true)}
          >
            <FaSearch size={18} /> <span>Tìm bạn</span>
          </div>
        </div>
        <div className="settings-container">
          <div
            className="settings-icon"
            onClick={() => setShowSettings(!showSettings)}
          >
            <FaCog size={20} />
          </div>
          {showSettings && (
            <div className="settings-menu">
              <button
                className="settings-item account"
                onClick={() => setIsAccountModalOpen(true)}
              >
                <FaUser size={16} /> Tài khoản
              </button>
              <button className="settings-item logout" onClick={handleLogout}>
                <FaSignOutAlt size={16} /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
      {showFriendSidebar && (
        <FriendList
          uid={uid}
          token={token}
          onStartChat={handleStartChatFromSidebar}
          onClose={() => setShowFriendSidebar(false)}
        />
      )}
      <div
        className={`main-content ${
          showFriendSidebar ? "with-friend-sidebar" : ""
        } ${tabs === "Invite" ? "no-flex" : ""}`}
      >
        {tabs === "" && (
          <div className="welcome">
            <h1>👋 Chào mừng đến với LoopupChat</h1>
          </div>
        )}
        {tabs === "Chat" && (
          <div className="chat-list">
            <h3 className="chat-title">
              Trò Chuyện
              <button
                className={`refresh-button ${isLoadingChats ? "rotating" : ""}`}
                title="Làm mới"
                onClick={loadChats}
                disabled={isLoadingChats}
              >
                {isLoadingChats ? (
                  <>
                    <FaSyncAlt size={16} />
                    <span>Đang tải...</span>
                  </>
                ) : (
                  <>
                    <FaSyncAlt size={16} />
                    <span>Làm mới</span>
                  </>
                )}
              </button>{" "}
            </h3>
            <div className="search-box">
              <BiSearch className="search-icon" />
              <input type="text" placeholder="Tìm kiếm cuộc trò chuyện..." />
              <button
                className="icon-button"
                title="Tìm bạn"
                onClick={() => setIsFindFriendModalOpen(true)}
              >
                <FaUserPlus size={18} />
              </button>
              <button
                className="icon-button"
                title="Tạo nhóm"
                onClick={() => setIsGroupModalOpen(true)}
              >
                <FaUsers size={18} />
              </button>
            </div>{" "}
            <ChatList
              chats={chats}
              isLoading={isLoadingChats}
              error={chatError}
              currentChat={currentChat}
              participantsInfo={enhancedParticipantsInfo}
              onChatSelect={handleChatSelect}
              onRetry={loadChats}
              onFindFriend={() => setIsUserModalOpen(true)}
              uid={uid}
            />
          </div>
        )}
        {tabs === "Chat" && currentChat && currentParticipant ? (
          <>
            <div className="chat-area">
              <ChatHeader
                currentChat={currentChat}
                currentParticipant={currentParticipant}
                onInfoClick={() => setChatInfor(!chatInfor)}
                onVideoCall={handleStartVideoCall}
                onSearch={() => {}}
              />

              <div className="chat-content" ref={chatContentRef}>
                {isLoadingMessages ? (
                  <div className="loading-messages">
                    <p>Đang tải tin nhắn...</p>
                  </div>
                ) : messageError ? (
                  <div className="message-error">
                    <p>{messageError}</p>
                    <button onClick={() => loadMessages(currentChat.chatId)}>
                      Thử lại
                    </button>
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="messages-wrapper">
                    {messages.map((msg, index) => {
                      const isCurrentUser = msg.sender === uid;
                      const showAvatar =
                        index === 0 ||
                        (index > 0 &&
                          messages[index - 1].sender !== msg.sender);

                      // Sử dụng component MessageItem để render tin nhắn
                      return (
                        <MessageItem
                          key={msg.id || `msg-${index}`}
                          message={msg}
                          isCurrentUser={isCurrentUser}
                          showAvatar={showAvatar}
                          participant={
                            !isCurrentUser ? currentParticipant : userInfo
                          }
                          previousSender={
                            index > 0 ? messages[index - 1].sender : null
                          }
                        />
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="no-messages">
                    <img src="/logo.png" alt="Logo" className="chat-logo" />
                    <p>Chưa có tin nhắn nào</p>
                    <p>Hãy bắt đầu cuộc trò chuyện</p>
                  </div>
                )}
              </div>

              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <TypingIndicator
                  typingUsers={typingUsers}
                  participantsInfo={participantsInfo}
                  currentChat={currentChat}
                />
              )}

              <div className="chat-input-area">
                <div className="chat-input-container">
                  <button
                    className="emoji-btn"
                    title="Chọn emoji"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <FaSmile />
                  </button>{" "}
                  <input
                    ref={messageInputRef}
                    type="text"
                    placeholder="Tin nhắn..."
                    value={newMessage}
                    onChange={handleMessageInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={(e) => {
                      handleKeyPress(e);
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <div className="input-actions">
                    {/* File Upload */}
                    <label
                      htmlFor="file-upload"
                      className="file-upload-label"
                      title="Gửi file"
                    >
                      <FaFileAlt />
                    </label>
                    <input
                      type="file"
                      id="file-upload"
                      className="file-upload-input"
                      onChange={handleFileUpload}
                    />

                    {/* Image Upload */}
                    <label
                      htmlFor="image-upload"
                      className="image-upload-label"
                      title="Gửi ảnh"
                    >
                      <FaImage />
                    </label>
                    <input
                      type="file"
                      id="image-upload"
                      className="image-upload-input"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />

                    {/* Button Send */}
                    <button
                      className="send-btn"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <BsSendFill />
                    </button>
                  </div>
                </div>

                {showEmojiPicker && (
                  <div className="emoji-picker-container">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <img src="/logo.png" alt="Logo" className="welcome-logo" />
            <h2>Chào mừng đến với Loopup Chat</h2>
            <p>Vui lòng chọn một cuộc trò chuyện để bắt đầu</p>
            {!chats || chats.length === 0 ? (
              <button
                className="find-friend-btn"
                onClick={() => setIsFindFriendModalOpen(true)}
              >
                <FaUserPlus /> Tìm bạn để trò chuyện
              </button>
            ) : null}
          </div>
        )}
        {tabs === "Invite" && (
          <InviteTab uid={uid} token={token} onClose={() => setTabs("Chat")} />
        )}
        <Modal
          isOpen={isAccountModalOpen}
          onRequestClose={() => setIsAccountModalOpen(false)}
          className="account-modal"
          overlayClassName="overlay"
        >
          <div className="account-header">
            <h2>Thông tin tài khoản</h2>
            <button
              className="close-btn"
              onClick={() => setIsAccountModalOpen(false)}
            >
              <FaTimes />
            </button>
          </div>

          {userInfo ? (
            <div className="account-info">
              <div className="cover-photo">
                <img
                  src="https://cdn.statically.io/img/timelinecovers.pro/f=webp/facebook-cover/thumbs540/forest_in_the_morning-facebook-cover.jpg"
                  alt="Ảnh bìa"
                />
                <button className="change-cover-btn">
                  <FaImage size={12} /> Thay đổi ảnh bìa
                </button>
              </div>

              <div className="avatar-section">
                <div className="avatar-container">
                  <img
                    className="avatar"
                    src={userInfo.avatarUrl || "/default-avatar.png"}
                    alt="avatar"
                    onError={(e) => {
                      e.target.src = "/default-avatar.png";
                    }}
                  />
                  <button
                    className="change-avatar-btn"
                    title="Thay đổi ảnh đại diện"
                  >
                    <FaCamera size={14} />
                  </button>
                </div>

                <h2>
                  {userInfo.lastName} {userInfo.firstName}
                </h2>

                <div className="user-status">
                  <div className="status-dot"></div>
                  <span>Đang hoạt động</span>
                </div>
              </div>

              <div className="tabs">
                <div className="tab active">Thông tin cá nhân</div>
                <div className="tab">Cài đặt</div>
              </div>

              <div className="user-details">
                <div className="detail-group">
                  <div className="detail-label">Họ</div>
                  <div className="detail-value">
                    {userInfo.lastName || "Chưa cập nhật"}
                    <FaPencilAlt size={14} className="edit-icon" />
                  </div>
                </div>

                <div className="detail-group">
                  <div className="detail-label">Tên</div>
                  <div className="detail-value">
                    {userInfo.firstName || "Chưa cập nhật"}
                    <FaPencilAlt size={14} className="edit-icon" />
                  </div>
                </div>

                <div className="detail-group">
                  <div className="detail-label">Email</div>
                  <div className="detail-value">{userInfo.email}</div>
                </div>

                <div className="detail-group">
                  <div className="detail-label">Giới tính</div>
                  <div className="detail-value">
                    {userInfo.gender === "male" ? "Nam" : "Nữ"}
                    <FaPencilAlt size={14} className="edit-icon" />
                  </div>
                </div>

                <div className="note">
                  Thông tin cá nhân của bạn được bảo mật. Chỉ những người bạn
                  kết nối mới có thể xem thông tin chi tiết.
                </div>
              </div>

              <button className="update-btn">
                <FaCheck size={16} /> Lưu thay đổi
              </button>
            </div>
          ) : (
            <div className="loading-info">
              <div className="loading-spinner"></div>
              <p>Đang tải thông tin...</p>
            </div>
          )}
        </Modal>
        <Modal
          isOpen={showFriends}
          onRequestClose={() => setShowFriends(false)}
          className="modal friendlist-modal"
          overlayClassName="overlay"
        >
          <h2>Danh sách bạn bè</h2>
          {friendList.length === 0 ? (
            <div className="no-friends">
              <p>Bạn chưa có bạn bè nào.</p>
              <button
                className="find-friend-btn"
                onClick={() => {
                  setShowFriends(false);
                  setIsUserModalOpen(true);
                }}
              >
                Tìm bạn
              </button>
            </div>
          ) : (
            <ul className="friend-list">
              {friendList.map((friend) => (
                <li key={friend.uid} className="friend-item">
                  <img
                    src={friend.avatarUrl || "/default-avatar.png"}
                    alt="avatar"
                    className="friend-avatar"
                    onError={(e) => {
                      e.target.src = "/default-avatar.png";
                    }}
                  />
                  <span className="friend-name">
                    {friend.lastName} {friend.firstName}
                  </span>
                  <button
                    className="chat-btn"
                    onClick={() => {
                      handleStartChat(friend);
                      setShowFriends(false);
                    }}
                  >
                    Nhắn tin
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button className="close-btn" onClick={() => setShowFriends(false)}>
            Đóng
          </button>
        </Modal>
        <Modal
          isOpen={isGroupModalOpen}
          onRequestClose={() => setIsGroupModalOpen(false)}
          className="modal create-group-modal"
          overlayClassName="overlay"
        >
          <CreateGroupModal
            onClose={() => setIsGroupModalOpen(false)}
            userId={uid}
          />
        </Modal>
        <FindFriendModal
          isOpen={isFindFriendModalOpen}
          onClose={() => setIsFindFriendModalOpen(false)}
          uid={uid}
          token={token}
        />
        {currentParticipant && tabs === "Chat" && chatInfor && (
          <InformationChat
            user={currentParticipant}
            isGroupChat={currentChat?.isGroupChat || false}
            isAdmin={currentChat?.adminId === uid}
            chat={currentChat} // Thêm prop chat
            uid={uid}
            onClose={() => setChatInfor(false)}
            onLeftGroup={handleLeaveCurrentChat}
          />
        )}
        <Modal
          isOpen={isVideoCall}
          onRequestClose={handleEndCall}
          className="video-call-modal bg-transparent"
          overlayClassName="overlay bg-black bg-opacity-80"
        >
          <VideoCall
            localStream={localStream}
            remoteStream={remoteStream}
            localUserName={`${userInfo?.firstName} ${userInfo?.lastName}`}
            remoteUserName={`${currentParticipant?.firstName} ${currentParticipant?.lastName}`}
            onEndCall={handleEndCall}
          />
        </Modal>
        <Modal
          isOpen={!!incomingCall}
          onRequestClose={() => {
            handleRejectCall();
            if (audio) {
              audio.pause();
              audio.currentTime = 0;
            }
          }}
          className="incoming-call-modal"
          overlayClassName="overlay"
        >
          <div className="modal-content">
            <img
              src={currentParticipant?.avatarUrl || "/default-avatar.png"}
              alt="caller"
              className="caller-avatar"
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />
            <h2 className="caller-name">
              Cuộc gọi video từ {currentParticipant?.firstName || "Người dùng"}{" "}
              {currentParticipant?.lastName || "không xác định"}
            </h2>
            <div className="button-group">
              <button
                className="accept-btn"
                onClick={() => {
                  playRingtone();
                  handleAcceptCall();
                  if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                  }
                }}
              >
                Chấp nhận
              </button>
              <button
                className="reject-btn"
                onClick={() => {
                  playRingtone();
                  handleRejectCall();
                  if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                  }
                }}
              >
                Từ chối
              </button>
            </div>
          </div>
        </Modal>
      </div>
      <Toast />
    </div>
  );
};

export default Home;
