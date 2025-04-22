import React, { useState, useEffect } from "react";
import "./styles/Home.css";
import { FaCog, FaUserPlus, FaUsers } from "react-icons/fa";
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
import { fetchChats, fetchMessages, fetchParticipantInfo, sendMessage } from "../services/chatService";

Modal.setAppElement('#root'); // Đảm bảo modal hoạt động đúng

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
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! How are you?",
      senderId: "1",
      timestamp: new Date("2025-04-15T14:20:00"),
    },
    {
      id: 2,
      text: "I'm fine, thank you!",
      senderId: "2",
      timestamp: new Date("2025-04-15T14:21:00"),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [chats, setChats] = useState([]); 
  const [participantsInfo, setParticipantsInfo] = useState({});
  const [currentChat, setCurrentChat] = useState(null);
  const [currentParticipant, setCurrentParticipant] = useState(null);

  const navigate = useNavigate();

  // Lấy thông tin người dùng
  useEffect(() => {
    if (isAccountModalOpen && uid) {
      fetch(`http://localhost:8080/api/auth/user/${uid}`)
        .then((res) => res.json())
        .then((data) => setUserInfo(data))
        .catch((err) => console.error("Lỗi khi lấy user info:", err));
    }
  }, [isAccountModalOpen, uid]);

  // Lấy danh sách chat và thông tin người tham gia
  useEffect(() => {
    const loadChats = async () => {
      try {
        if (!token) return;
        
        const chatList = await fetchChats(token);
        setChats(chatList);

        // Lấy thông tin participants cho từng chat
        const participantPromises = chatList.map(async (chat) => {
          const participantInfo = await fetchParticipantInfo(chat.chatId, uid);
          return { chatId: chat.chatId, participantInfo };
        });

        const participantResults = await Promise.all(participantPromises);
        const participantMap = participantResults.reduce((acc, item) => {
          acc[item.chatId] = item.participantInfo;
          return acc;
        }, {});

        setParticipantsInfo(participantMap);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách cuộc trò chuyện:", err);
      }
    };

    loadChats();
  }, [token, uid]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    navigate("/");
  };

  // Lấy danh sách bạn bè
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

  // Tìm kiếm người dùng
  const handleSearchUser = async () => {
    if (!searchEmail) return;
    try {
      const res = await fetch(`http://localhost:8080/api/user/find?email=${searchEmail}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
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

      const checkRes = await fetch(`http://localhost:8080/api/friends/status/${uid}/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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

  // Gửi lời mời kết bạn
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

  // Bắt đầu cuộc trò chuyện với bạn bè
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

      // Cập nhật trạng thái để hiển thị cuộc trò chuyện
      setCurrentChat(chatData);
      setCurrentParticipant(friend);
      setShowFriends(false);
      
      // Lấy tin nhắn cho cuộc trò chuyện
      const messagesData = await fetchMessages(chatData.chatId, token);
      setMessages(messagesData);
    } catch (err) {
      console.error("Lỗi khi bắt đầu cuộc trò chuyện:", err);
    }
  };

  // Gửi tin nhắn
  const handleSendMessage = async () => {
    try {
      if (!currentChat || !newMessage.trim()) return;

      // Gửi tin nhắn đến server
      const response = await sendMessage(
        currentChat.chatId,
        uid,
        newMessage,
        token
      );

      // Thêm tin nhắn mới vào danh sách tin nhắn hiện tại
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: uid,
          message: newMessage,
          timestamp: new Date(),
        },
      ]);

      // Xóa nội dung ô nhập tin nhắn
      setNewMessage("");

      // Tải lại danh sách tin nhắn từ server để đảm bảo đồng bộ
      const updatedMessages = await fetchMessages(currentChat.chatId, token);
      setMessages(updatedMessages);
    } catch (err) {
      console.error("Lỗi khi gửi tin nhắn:", err);
    }
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">LOOPUP</div>
        <div className="sidebar-icons">
          <div className="icon active" title="Chat" onClick={() => {
            setTabs("Chat")
          }}>💬 <span>Chat</span>
          </div>
          <div className="icon" title="Bạn bè" onClick={() => {
            setTabs("Friend")
          }}>👥 <span>Bạn bè</span></div>
          <div className="icon" title="Lời mời kết bạn" onClick={() => {
            setTabs("Invite")
          }}>👨‍👩‍👦<span>Lời mời</span></div>
        </div>

        <div className="settings-container">
          <div
            className="settings-icon"
            title="Cài đặt"
            onClick={() => setShowSettings(!showSettings)}
          >
            <FaCog />
          </div>
          {showSettings && (
            <div className="settings-menu show">
              <button className="settings-item" onClick={() => setIsAccountModalOpen(true)}>👤 Thông tin tài khoản</button>
              <button className="settings-item logout" onClick={handleLogout}>🚪 Đăng xuất</button>
            </div>
          )}
        </div>
      </div>

      {/*WELCOME*/}
      {tabs === "" && (
        <div className={"welcome"}>
          <h1>👋 Chào mừng đến với LoopupChat</h1>
        </div>
      )}
      
      {/* Chat list */}
      {tabs === "Chat" && (
        <div className="chat-list">
          <h3 className="chat-title">Trò Chuyện</h3>
          <div className="search-box">
            <BiSearch className="search-icon" size={50} />
            <input type="text" placeholder="Tìm kiếm" />
            <button className="icon-button" title="Thêm bạn" onClick={() => setIsUserModalOpen(true)}>
              <FaUserPlus size={27} />
            </button>
            <button className="icon-button" title="Tạo nhóm" onClick={() => setIsGroupModalOpen(true)}>
              <FaUsers size={27} />
            </button>
          </div>

          <div className="chat-items">
            {chats.map((chat) => {
              const participant = participantsInfo[chat.chatId];
              return (
                <div 
                  className="chat-item" 
                  key={chat.chatId}
                  onClick={async () => {
                    setCurrentChat(chat);
                    setCurrentParticipant(participantsInfo[chat.chatId]);
                    
                    try {
                      const messagesData = await fetchMessages(chat.chatId, token);
                      setMessages(messagesData);
                    } catch (err) {
                      console.error("Lỗi khi lấy tin nhắn:", err);
                    }
                  }}
                >
                  <div className="chat-avatar"></div>
                  <div className="chat-info">
                    <p className="chat-name">
                      {participant ? `${participant.firstName} ${participant.lastName}` : "Người dùng"}
                    </p>
                    <p className="chat-preview">{chat.lastMessage || "Không có tin nhắn"}</p>
                  </div>
                  <span className="chat-time">
                    {chat.lastUpdated ? new Date(chat.lastUpdated).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    }) : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Chat main */}
      {tabs === "Chat" && (
        <div className="chat-main">
          {currentChat && currentParticipant ? (
            <>
              <div className="chat-header">
                <div className="chat-user">
                  <div className="chat-user-avatar"></div>
                  <div>
                    <p className="chat-user-name">
                      {currentParticipant.firstName} {currentParticipant.lastName}
                    </p>
                    <p className="chat-status">Đang hoạt động</p>
                  </div>
                </div>
              </div>

              <div className="chat-content">
                {messages.map((msg, index) => (
                  <div 
                    key={msg.id || index} 
                    className={`message ${(msg.senderId === "1" || msg.sender === uid) ? "right" : "left"}`}
                  >
                    <div className="msg">{msg.text || msg.message}</div>
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="chat-input-area">
                <input
                  type="text"
                  placeholder="Tin nhắn"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                />
                <button className="send-btn" onClick={handleSendMessage}>
                  <BsSendFill />
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Vui lòng chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          )}
        </div>
      )}

      {/* Modal thêm bạn */}
      <Modal
        isOpen={isUserModalOpen}
        onRequestClose={() => setIsUserModalOpen(false)}
        className="modal"
        overlayClassName="overlay"
      >
        <h3>Tìm bạn bằng email</h3>
        <input
          type="email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          placeholder="Nhập email người dùng"
        />
        <button onClick={handleSearchUser}>Tìm</button>

        {foundUser && (
          <div className="user-result">
            <p>👤 {foundUser.lastName} {foundUser.firstName}</p>
            {isFriend === "accepted" && <button className="chat-btn">Nhắn tin</button>}
            {isFriend === "pending" && <button className="pending-btn" disabled>Đã gửi kết bạn</button>}
            {isFriend === "none" && (
              <button className="add-btn" onClick={handleSendRequest}>Kết bạn</button>
            )}

          </div>
        )}
        {showNotFound && <p className="not-found-msg">Không tìm thấy</p>}
      </Modal>

      {/* Modal thông tin người dùng */}
      <Modal
        isOpen={isAccountModalOpen}
        onRequestClose={() => setIsAccountModalOpen(false)}
        className="account-modal"
        overlayClassName="overlay"
      >
        {userInfo ? (
          <div className="account-info">
            <div className="cover-photo">
              <img src="https://cdn.statically.io/img/timelinecovers.pro/f=webp/facebook-cover/thumbs540/forest_in_the_morning-facebook-cover.jpg" alt="cover" />
            </div>
            <div className="avatar-section">
              <img className="avatar" src={userInfo.avatarUrl} alt="avatar" />
              <h2>{userInfo.lastName} {userInfo.firstName} ✏️</h2>
            </div>
            <div className="user-details">
              <p><strong>Email:</strong> {userInfo.email}</p>
              <p><strong>Giới tính:</strong> {userInfo.gender === "male" ? "Nam" : "Nữ"}</p>
              <p className="note">Chỉ bạn bè có lưu số của bạn trong danh bạ máy xem được số này</p>
            </div>
            <button className="update-btn">🔄 Cập nhật</button>
          </div>
        ) : (
          <p style={{ color: "white", textAlign: "center" }}>Đang tải thông tin...</p>
        )}
      </Modal>

      {/* Modal danh sách bạn bè */}
      <Modal
        isOpen={showFriends}
        onRequestClose={() => setShowFriends(false)}
        className="modal friendlist-modal"
        overlayClassName="overlay"
      >
        <h2>Danh sách bạn bè</h2>
        {friendList.length === 0 ? (
          <p>Bạn chưa có bạn bè nào.</p>
        ) : (
          <ul className="friend-list">
            {friendList.map((friend) => (
              <li key={friend.id} className="friend-item">
                <img src={friend.avatarUrl || "/default-avatar.png"} alt="avatar" className="friend-avatar" />
                <span className="friend-name">{friend.lastName} {friend.firstName}</span>
                <button className="chat-btn" onClick={() => handleStartChat(friend)}>Nhắn tin</button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/*modal tạo nhóm*/}
      <Modal
        isOpen={isGroupModalOpen}
        onRequestClose={() => setIsGroupModalOpen(false)}
        className="modal create-group-modal"
        overlayClassName="overlay"
      >
        <CreateGroupModal
          onClose={() => setIsGroupModalOpen(false)}
        />
      </Modal>

      {tabs === "Chat" && (
        <InformationChat/>
      )}

      {tabs === "Friend" && (
        <FriendTab uid={uid}/>
      )}

      {tabs === "Invite" && (
        <InviteTab uid={uid}/>
      )}
    </div>
  );
};

export default Home;
