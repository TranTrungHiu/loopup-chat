import React, { useState, useEffect, useCallback, useRef } from "react";
import "./styles/Home.css";
// Material-UI imports
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
// Material UI Icons
import {
  Settings as SettingsIcon,
  Search as SearchIcon,
  Send as SendIcon,
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  Refresh as RefreshIcon,
  Chat as ChatIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
} from "@mui/icons-material";
// Existing imports
import {
  FaCog,
  FaUserPlus,
  FaUsers,
  FaSync,
  FaComments,
  FaUserFriends,
  FaSearch,
} from "react-icons/fa";
import { BsSendFill } from "react-icons/bs";
import { BiSearch } from "react-icons/bi";
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
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import {
  fetchChats,
  fetchMessages,
  fetchParticipantInfo,
  sendMessage,
  fetchUserByUid,
} from "../services/chatService";
import ChatList from "../component/ChatList";
// For timestamp formatting
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";

Modal.setAppElement("#root"); // Đảm bảo modal hoạt động đúng

const Home = () => {
  const [friendList, setFriendList] = useState([]);
  const [showFriends, setShowFriends] = useState(false);
  const uid = localStorage.getItem("uid");
  const token = localStorage.getItem("idToken");
  console.log("UID hiện tại:", uid);

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
  const [currentChat, setCurrentChat] = useState(null);
  const [currentParticipant, setCurrentParticipant] = useState(null);

  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState(null);

  const [showFriendSidebar, setShowFriendSidebar] = useState(false);

  const [isFindFriendModalOpen, setIsFindFriendModalOpen] = useState(false);

  const navigate = useNavigate();

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

      console.log("Loading chat list with token");

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
      console.log("Chat list received:", chatList);
      setChats(Array.isArray(chatList) ? chatList : []);

      if (Array.isArray(chatList) && chatList.length > 0) {
        const participantMap = {};

        for (const chat of chatList) {
          try {
            console.log(`Getting participant info for chat ${chat.chatId}`);
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
    await signOut(auth);
    localStorage.clear();
    navigate("/");
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
      console.log("Danh sách bạn bè:", data);
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
        console.warn("Người dùng không tìm thấy");
        setFoundUser(null);
        setShowNotFound(true);
        setTimeout(() => setShowNotFound(false), 3000);
        return;
      }

      const user = await res.json();
      console.log("Người dùng tìm được:", user);
      setFoundUser(user);

      const checkRes = await fetch(
        `http://localhost:8080/api/friends/status/${uid}/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await checkRes.json();
      console.log("Trạng thái bạn bè:", result);
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
          userId2: foundUser.id,
        }),
      });

      if (!res.ok) {
        const errorMessage = await res.text();
        console.error("Lỗi gửi lời mời kết bạn:", errorMessage);
        alert(errorMessage);
        return;
      }

      setIsFriend("pending");
      alert("Lời mời kết bạn đã được gửi.");
    } catch (err) {
      console.error("Lỗi gửi lời mời kết bạn:", err);
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
          user2: friend.id,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Lỗi từ API:", errorText);
        throw new Error("Lỗi khi tạo hoặc lấy cuộc trò chuyện");
      }

      const chatData = await res.json();
      console.log("Cuộc trò chuyện:", chatData);

      // Set the tab first to ensure chat view is displayed
      setTabs("Chat");

      // Then set current chat and participant
      setCurrentChat(chatData);
      setCurrentParticipant(friend);

      // Close the friends modal
      setShowFriends(false);

      // Load messages for the chat
      loadMessages(chatData.chatId);
    } catch (err) {
      console.error("Lỗi khi bắt đầu cuộc trò chuyện:", err);
      alert("Không thể bắt đầu cuộc trò chuyện, vui lòng thử lại sau.");
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
          user2: friend.id,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Lỗi từ API:", errorText);
        throw new Error("Lỗi khi tạo hoặc lấy cuộc trò chuyện");
      }

      const chatData = await res.json();
      console.log("Cuộc trò chuyện:", chatData);

      setTabs("Chat");

      setCurrentChat(chatData);
      setCurrentParticipant(friend);

      loadMessages(chatData.chatId);

      loadChats();
    } catch (err) {
      console.error("Lỗi khi bắt đầu cuộc trò chuyện:", err);
      alert("Không thể bắt đầu cuộc trò chuyện, vui lòng thử lại sau.");
    }
  };

  const loadMessages = async (chatId) => {
    setIsLoadingMessages(true);
    setMessageError(null);

    try {
      console.log(`Đang tải tin nhắn cho chat ${chatId}`);
      const messagesData = await fetchMessages(chatId, token);
      console.log(`Nhận được ${messagesData?.length || 0} tin nhắn`);
      setMessages(Array.isArray(messagesData) ? messagesData : []);
    } catch (err) {
      console.error("Lỗi khi tải tin nhắn:", err);
      setMessageError("Không thể tải tin nhắn");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    try {
      if (!currentChat || !newMessage.trim()) return;

      const trimmedMessage = newMessage.trim();

      const tempMessage = {
        id: `temp-${Date.now()}`,
        sender: uid,
        message: trimmedMessage,
        timestamp: new Date(),
        pending: true,
      };

      setMessages((prevMessages) => [...prevMessages, tempMessage]);

      setNewMessage("");

      const response = await sendMessage(
        currentChat.chatId,
        uid,
        trimmedMessage,
        token
      );

      console.log("Tin nhắn đã được gửi:", response);

      loadMessages(currentChat.chatId);

      loadChats();
    } catch (err) {
      console.error("Lỗi khi gửi tin nhắn:", err);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.pending ? { ...msg, error: true, pending: false } : msg
        )
      );
      alert("Không thể gửi tin nhắn, vui lòng thử lại.");
    }
  };

  const handleChatSelect = useCallback(
    async (chat) => {
      console.log("Chọn chat:", chat);
      setCurrentChat(chat);

      if (participantsInfo[chat.chatId]) {
        setCurrentParticipant(participantsInfo[chat.chatId]);
        loadMessages(chat.chatId);
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
    [participantsInfo, uid, loadMessages]
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
          user2: otherUser.id,
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
    } catch (error) {
      console.error("Lỗi khi bắt đầu cuộc trò chuyện:", error);
      alert("Không thể bắt đầu cuộc trò chuyện. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="logo">LOOPUP</div>
        <div className="sidebar-icons">
          <div
            className={`icon ${tabs === "Chat" ? "active" : ""}`}
            title="Chat"
            onClick={() => setTabs("Chat")}
          >
            <FaComments size={18} /> <span>Chat</span>
          </div>
          <div
            className={`icon ${tabs === "Friend" ? "active" : ""}`}
            title="Bạn bè"
            onClick={() => setTabs("Friend")}
          >
            <FaUserFriends size={18} /> <span>Bạn bè</span>
          </div>
          <div
            className={`icon ${tabs === "Invite" ? "active" : ""}`}
            title="Lời mời kết bạn"
            onClick={() => setTabs("Invite")}
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
                onClick={() => {
                  setIsAccountModalOpen(true);
                  setShowSettings(false);
                }}
              >
                <FaUser size={16} /> Tài khoản
              </button>
              <button
                className="settings-item"
                onClick={() => {
                  setShowFriendSidebar(!showFriendSidebar);
                  setShowSettings(false);
                }}
              >
                <FaUserFriends size={16} /> Bạn bè
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
        />
      )}
      <div
        className={`main-content ${
          showFriendSidebar ? "with-friend-sidebar" : ""
        }`}
      >
        {tabs === "" && (
          <div className={"welcome"}>
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
                {isLoadingChats ? "⏳" : "🔄"}
              </button>
            </h3>
            <div className="search-box">
              <BiSearch className="search-icon" size={50} />
              <input type="text" placeholder="Tìm kiếm" />
              <button
                className="icon-button"
                title="Tìm bạn"
                onClick={() => setIsFindFriendModalOpen(true)}
              >
                <FaUserPlus size={27} />
              </button>
              <button
                className="icon-button"
                title="Tạo nhóm"
                onClick={() => setIsGroupModalOpen(true)}
              >
                <FaUsers size={27} />
              </button>
            </div>

            <ChatList
              chats={chats}
              isLoading={isLoadingChats}
              error={chatError}
              currentChat={currentChat}
              participantsInfo={participantsInfo}
              onChatSelect={handleChatSelect}
              onRetry={loadChats}
              onFindFriend={() => setIsUserModalOpen(true)}
            />
          </div>
        )}

        {tabs === "Chat" && (
          <div className="chat-main">
            {currentChat && currentParticipant ? (
              <>
                <div className="chat-header">
                  <div className="chat-user">
                    <div className="chat-user-avatar">
                      <img
                        src={
                          currentParticipant.avatarUrl || "/default-avatar.png"
                        }
                        alt="avatar"
                        onError={(e) => {
                          e.target.src = "/default-avatar.png";
                        }}
                      />
                    </div>
                    <div>
                      <p className="chat-user-name">
                        {currentParticipant.firstName}{" "}
                        {currentParticipant.lastName}
                      </p>
                      <p className="chat-status">Đang hoạt động</p>
                    </div>
                  </div>
                </div>

                <div className="chat-content">
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
                    messages.map((msg, index) => {
                      const isCurrentUser =
                        msg.sender === uid ||
                        msg.senderId === uid ||
                        msg.senderId === "1";

                      const isPending = msg.pending === true;
                      const hasError = msg.error === true;

                      return (
                        <div
                          key={msg.id || `msg-${index}`}
                          className={`message ${
                            isCurrentUser ? "right" : "left"
                          } ${isPending ? "pending" : ""} ${
                            hasError ? "error" : ""
                          }`}
                        >
                          <div className="msg">
                            {msg.message || msg.text || "Không có nội dung"}
                            {isPending && (
                              <span className="status-indicator">⏳</span>
                            )}
                            {hasError && (
                              <span className="status-indicator">❌</span>
                            )}
                          </div>
                          <div className="message-time">
                            {msg.timestamp
                              ? (() => {
                                  try {
                                    // Check if timestamp is a Firestore timestamp object
                                    if (
                                      msg.timestamp &&
                                      msg.timestamp.seconds
                                    ) {
                                      return format(
                                        new Date(msg.timestamp.seconds * 1000),
                                        "HH:mm:ss",
                                        { locale: vi }
                                      );
                                    }
                                    // Handle regular Date objects or ISO strings
                                    const date = new Date(msg.timestamp);
                                    if (!isNaN(date.getTime())) {
                                      return format(date, "HH:mm:ss", {
                                        locale: vi,
                                      });
                                    }
                                    return "";
                                  } catch (error) {
                                    console.error(
                                      "Error formatting date:",
                                      error
                                    );
                                    return "";
                                  }
                                })()
                              : ""}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-messages">
                      <p>Chưa có tin nhắn nào</p>
                      <p>Hãy bắt đầu cuộc trò chuyện</p>
                    </div>
                  )}
                </div>

                <div className="chat-input-area">
                  <input
                    type="text"
                    placeholder="Tin nhắn"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendMessage();
                    }}
                  />
                  <button
                    className="send-btn"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <BsSendFill />
                  </button>
                </div>
              </>
            ) : (
              <div className="no-chat-selected">
                <p>Vui lòng chọn một cuộc trò chuyện để bắt đầu</p>
                {!chats || chats.length === 0 ? (
                  <button
                    className="find-friend-btn"
                    onClick={() => setIsUserModalOpen(true)}
                  >
                    Tìm bạn để trò chuyện
                  </button>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
      <Modal
        isOpen={isUserModalOpen}
        onRequestClose={() => setIsUserModalOpen(false)}
        className="modal"
        overlayClassName="overlay"
      >
        <h3>Tìm bạn bằng email</h3>
        <div className="search-form">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Nhập email người dùng"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchUser();
            }}
          />
          <button onClick={handleSearchUser}>Tìm</button>
        </div>

        {foundUser && (
          <div className="user-result">
            <p>
              👤 {foundUser.lastName} {foundUser.firstName}
            </p>
            {isFriend === "accepted" && (
              <button
                className="chat-btn"
                onClick={() => {
                  handleStartChat(foundUser);
                  setIsUserModalOpen(false);
                }}
              >
                Nhắn tin
              </button>
            )}
            {isFriend === "pending" && (
              <button className="pending-btn" disabled>
                Đã gửi kết bạn
              </button>
            )}
            {isFriend === "none" && (
              <button className="add-btn" onClick={handleSendRequest}>
                Kết bạn
              </button>
            )}
          </div>
        )}
        {showNotFound && <p className="not-found-msg">Không tìm thấy</p>}

        <button className="close-btn" onClick={() => setIsUserModalOpen(false)}>
          Đóng
        </button>

        <button className="show-friends-btn" onClick={fetchFriends}>
          Xem danh sách bạn bè
        </button>
      </Modal>
      <Modal
        isOpen={isAccountModalOpen}
        onRequestClose={() => setIsAccountModalOpen(false)}
        className="account-modal"
        overlayClassName="overlay"
      >
        {userInfo ? (
          <div className="account-info">
            <div className="cover-photo">
              <img
                src="https://cdn.statically.io/img/timelinecovers.pro/f=webp/facebook-cover/thumbs540/forest_in_the_morning-facebook-cover.jpg"
                alt="cover"
              />
            </div>
            <div className="avatar-section">
              <img
                className="avatar"
                src={userInfo.avatarUrl || "/default-avatar.png"}
                alt="avatar"
                onError={(e) => {
                  e.target.src = "/default-avatar.png";
                }}
              />
              <h2>
                {userInfo.lastName} {userInfo.firstName} ✏️
              </h2>
            </div>
            <div className="user-details">
              <p>
                <strong>Email:</strong> {userInfo.email}
              </p>
              <p>
                <strong>Giới tính:</strong>{" "}
                {userInfo.gender === "male" ? "Nam" : "Nữ"}
              </p>
              <p className="note">
                Chỉ bạn bè có lưu số của bạn trong danh bạ máy xem được số này
              </p>
            </div>
            <button className="update-btn">🔄 Cập nhật</button>
          </div>
        ) : (
          <div className="loading-info">
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
              <li key={friend.id} className="friend-item">
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
        <CreateGroupModal onClose={() => setIsGroupModalOpen(false)} />
      </Modal>
      <FindFriendModal
        isOpen={isFindFriendModalOpen}
        onClose={() => setIsFindFriendModalOpen(false)}
        uid={uid}
        token={token}
      />
      {tabs === "Chat" && <InformationChat />}
      {tabs === "Friend" && <FriendTab uid={uid} token={token} />}
      {tabs === "Invite" && <InviteTab uid={uid} token={token} />}
    </div>
  );
};

export default Home;
