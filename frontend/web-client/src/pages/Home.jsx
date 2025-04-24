import React, { useState, useEffect, useCallback, useRef } from "react";
import "./styles/Home.css";
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
import {
  FaCog,
  FaUserPlus,
  FaUsers,
  FaSync,
  FaVideo,
  FaInfoCircle,
  FaSyncAlt,
  FaComments,
  FaUserFriends,
  FaSearch,
  FaPencilAlt,
  FaUser,
  FaSignOutAlt,
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
import {
  fetchChats,
  fetchMessages,
  fetchParticipantInfo,
  sendMessage,
} from "../services/chatService";
import ChatList from "../component/ChatList";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";
import VideoCall from "../component/VideoCall";
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
  const [currentChat, setCurrentChat] = useState(null);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState(null);
  const [showFriendSidebar, setShowFriendSidebar] = useState(false);
  const [isFindFriendModalOpen, setIsFindFriendModalOpen] = useState(false);
  const navigate = useNavigate();

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
          console.error("File format not supported or file not found. Ensure /mp3/ringtone.mp3 exists in public folder.");
        } else if (err.name === "NotAllowedError") {
          console.error("Autoplay blocked. User interaction may be required before playing audio.");
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
            console.error(`Error getting participant for chat ${chat.chatId}:`, err);
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
    } catch (err) {
      console.error("Lỗi khi bắt đầu cuộc trò chuyện:", err);
      alert("Không thể bắt đầu cuộc trò chuyện, vui lòng thử lại sau.");
    }
  };

  const loadMessages = async (chatId) => {
    setIsLoadingMessages(true);
    setMessageError(null);

    try {
      const messagesData = await fetchMessages(chatId, token);
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
    [participantsInfo, uid]
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
    } catch (error) {
      console.error("Lỗi khi bắt đầu cuộc trò chuyện:", error);
      alert("Không thể bắt đầu cuộc trò chuyện. Vui lòng thử lại sau.");
    }
  };

  // Video call logic
  useEffect(() => {
    const connectWebSocket = () => {
      socket.current = new WebSocket(`ws://localhost:8080/ws/video?userId=${uid}`);
      
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
      alert("Vui lòng chọn người dùng để gọi video.");
      return;
    }

    try {
      await waitForWebSocket();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      }).catch((err) => {
        console.error("Media access error:", err);
        alert("Không thể truy cập camera hoặc micro. Vui lòng kiểm tra quyền.");
        throw err;
      });
      setLocalStream(stream);

      if (peerConnection.current) {
        peerConnection.current.close();
      }
      peerConnection.current = new RTCPeerConnection({ iceServers });

      stream.getTracks().forEach((track) =>
        peerConnection.current.addTrack(track, stream)
      );

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
      alert("Không thể bắt đầu cuộc gọi video: " + error.message);
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
      const response = await fetch(`http://localhost:8080/api/user/profile/${data.from}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Không thể lấy thông tin người gọi: ${response.status}`);
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      }).catch((err) => {
        console.error("Media access error:", err);
        alert("Không thể truy cập camera hoặc micro. Vui lòng kiểm tra quyền.");
        throw err;
      });
      setLocalStream(stream);

      if (peerConnection.current) {
        peerConnection.current.close();
      }
      peerConnection.current = new RTCPeerConnection({ iceServers });

      stream.getTracks().forEach((track) =>
        peerConnection.current.addTrack(track, stream)
      );

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
    } catch (error) {
      console.error("Lỗi khi nhận offer:", error);
      alert("Lỗi khi nhận cuộc gọi video: " + error.message);
      handleEndCall();
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      socket.current.send(
        JSON.stringify({
          type: "call-rejected",
          to: incomingCall.from,
          from: uid,
        })
      );
    }
    setIncomingCall(null);
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
    } catch (error) {
      console.error("Lỗi khi nhận answer:", error);
      alert("Lỗi khi xử lý trả lời cuộc gọi: " + error.message);
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

  const handleCallRejected = (data) => {
    alert("Cuộc gọi bị từ chối bởi người nhận.");
    handleEndCall();
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
                onClick={() => {
                  setIsAccountModalOpen(true);
                  setShowSettings(false);
                }}
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
                {isLoadingChats ? "⏳" : <FaSyncAlt size={20} />}
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
                    <div>
                      <div className="chat-user-avatar">
                        <img
                          src={currentParticipant.avatarUrl || "/default-avatar.png"}
                          alt="avatar"
                          onError={(e) => {
                            e.target.src = "/default-avatar.png";
                          }}
                        />
                      </div>
                      <div>
                        <p className="chat-user-name">
                          {currentParticipant.firstName} {currentParticipant.lastName}
                        </p>
                        <p className="chat-status">Đang hoạt động</p>
                      </div>
                    </div>
                    <div className="chat-actions">
                      <button
                        className="icon-button"
                        title="Gọi video"
                        onClick={handleStartVideoCall}
                      >
                        <FaVideo size={20} />
                      </button>
                      <button
                        className="icon-button"
                        title="Thông tin người dùng"
                        onClick={() => setChatInfor(!chatInfor)}
                      >
                        <FaInfoCircle size={20} />
                      </button>
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
                                    let date;
                                    if (msg.timestamp.seconds) {
                                      date = new Date(msg.timestamp.seconds * 1000);
                                    } else {
                                      date = new Date(msg.timestamp);
                                    }
                                    if (!isNaN(date.getTime())) {
                                      const hour = date
                                        .getHours()
                                        .toString()
                                        .padStart(2, "0");
                                      return `${hour}:00`;
                                    }
                                    return "";
                                  } catch (error) {
                                    console.error("Error formatting time:", error);
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
        {tabs === "Invite" && <InviteTab uid={uid} token={token} />}
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
                  Đang gửi kết bạn
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
          <button
            className="close-btn"
            onClick={() => setIsUserModalOpen(false)}
          >
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
          <div className="account-header">
            <h2>Thông tin người dùng</h2>
            <button
              className="close-btn"
              onClick={() => setIsAccountModalOpen(false)}
            >
              X
            </button>
          </div>
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
              <button className="update-btn">
                <FaPencilAlt size={20} /> Cập nhật
              </button>
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
          <InformationChat user={currentParticipant} />
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
              Cuộc gọi video từ{" "}
              {currentParticipant?.firstName || "Người dùng"}{" "}
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
    </div>
  );
};

export default Home;