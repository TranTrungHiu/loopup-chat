import React, { useState, useEffect } from "react";
import { 
  FaCheckCircle, 
  FaCheck, 
  FaExclamationCircle,
  FaDownload, 
  FaFile, 
  FaFileImage, 
  FaFilePdf, 
  FaFileWord, 
  FaFileExcel, 
  FaFilePowerpoint
} from "react-icons/fa";
import "../pages/styles/MessageItem.css";
import { fetchUserByUid } from "../services/chatService";

const MessageItem = ({ 
  message, 
  isCurrentUser, 
  showAvatar = true, 
  participant = null,
  formattedTime = "",
  previousSender
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [senderInfo, setSenderInfo] = useState(null);
  const token = localStorage.getItem("idToken");

  useEffect(() => {
    if (!message || !message.message) {
      console.log('Debugging message structure:', message);
    }

    // Fetch sender info if the message is not from the current user
    if (!isCurrentUser && message.sender) {
      const fetchSender = async () => {
        try {
          const userData = await fetchUserByUid(message.sender, token);
          setSenderInfo(userData);
        } catch (err) {
          console.error("Error fetching sender info:", err);
          setSenderInfo({
            firstName: "Người dùng",
            lastName: "không xác định",
            isDefault: true
          });
        }
      };
      fetchSender();
    }
  }, [message, isCurrentUser, token]);

  const shouldShowAvatar = showAvatar && !isCurrentUser;

  // Show sender name for messages not from the current user (both group and 1:1 chats)
  const shouldShowSender = !isCurrentUser;

  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFile />;
    
    const extension = fileName.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) {
      return <FaFileImage />;
    } else if (extension === 'pdf') {
      return <FaFilePdf />;
    } else if (['doc', 'docx'].includes(extension)) {
      return <FaFileWord />;
    } else if (['xls', 'xlsx'].includes(extension)) {
      return <FaFileExcel />;
    } else if (['ppt', 'pptx'].includes(extension)) {
      return <FaFilePowerpoint />;
    } else {
      return <FaFile />;
    }
  };
  
  const formatTime = (timestamp) => {
    if (formattedTime) return formattedTime;
    if (!timestamp) return '';
    
    try {
      let date;
      if (typeof timestamp === 'number') {
        const isInSeconds = timestamp.toString().length === 10;
        date = new Date(isInSeconds ? timestamp * 1000 : timestamp);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
        if (isNaN(date.getTime()) && timestamp.seconds) {
          date = new Date(timestamp.seconds * 1000);
        }
      } else if (timestamp && timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date();
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid date format:', timestamp);
        return 'Just now';
      }
      
      return date.toLocaleString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return 'Just now';
    }
  };
  
  const renderMessageStatus = () => {
    if (message.readBy && Object.keys(message.readBy).length > 0) {
      const readersNotSender = Object.keys(message.readBy).filter(
        readerId => readerId !== message.sender
      );
      if (readersNotSender.length > 0) { // Fixed the typo here
        return (
          <span className="message-status-icon seen" title="Đã xem">
            <FaCheckCircle />
          </span>
        );
      }
    }
    return (
      <span className="message-status-icon sent" title="Đã gửi">
        <FaCheck />
      </span>
    );
  };

  const renderMessageContent = () => {
    if (!message) {
      return 'No message data';
    }
    
    if (message.type === 'image') {
      return (
        <div className="message-bubble message-image-container">
          <img
            className="message-image"
            src={message.content || message.url || message.imageUrl}
            alt="Hình ảnh"
            onLoad={() => setImageLoaded(true)}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
          {!imageLoaded && <div className="image-loader">Đang tải...</div>}
          <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
            <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
            {isCurrentUser && renderMessageStatus()}
          </div>
        </div>
      );
    }
    
    if (message.type === 'file') {
      return (
        <div className="message-bubble">
          <div className="message-file">
            <div className="file-icon">
              {getFileIcon(message.fileName)}
            </div>
            <div className="file-info">
              <div className="file-name">{message.fileName || "File"}</div>
              <div className="file-size">{message.fileSize || ""}</div>
            </div>
            <a 
              href={message.content || message.url || message.fileUrl} 
              download={message.fileName || "file"}
              className="file-download"
              title="Tải xuống"
            >
              <FaDownload />
            </a>
          </div>
          <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
            <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
            {isCurrentUser && renderMessageStatus()}
          </div>
        </div>
      );
    }
    
    let textContent = "";
    if (typeof message === 'string') {
      textContent = message;
    } else {
      if (message.message !== undefined && message.message !== null) {
        textContent = String(message.message);
      } else if (message.content) {
        textContent = String(message.content);
      } else if (message.text) {
        textContent = String(message.text);
      } else if (message.data && typeof message.data === 'string') {
        textContent = message.data;
      }
    }
    
    if (!textContent && typeof message === 'object') {
      console.debug('Debug message structure:', Object.keys(message));
      const messageFields = Object.entries(message)
        .filter(([key]) => key !== 'readBy')
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return `${key}: [Object]`;
          }
          return `${key}: ${value}`;
        })
        .join(', ');
      
      if (debugMode) {
        return (
          <div className="message-bubble debug-message">
            <div className="message-text">
              <strong>Debug:</strong> {messageFields}
              <button 
                className="debug-button" 
                onClick={() => setDebugMode(false)}
              >
                Ẩn Debug
              </button>
            </div>
            <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
              <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
              {isCurrentUser && renderMessageStatus()}
            </div>
          </div>
        );
      } else {
        return (
          <div className="message-bubble">
            <div className="message-text">
              Không thể hiển thị nội dung tin nhắn
              <button 
                className="debug-button" 
                onClick={() => setDebugMode(true)}
              >
                Hiển thị Debug
              </button>
            </div>
            <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
              <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
              {isCurrentUser && renderMessageStatus()}
            </div>
          </div>
        );
      }
    }
    
    return (
      <div className="message-bubble">
        <div className="message-text">{textContent}</div>
        <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
          <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
          {isCurrentUser && renderMessageStatus()}
        </div>
      </div>
    );
  };

  const getAvatar = () => {
    const displayParticipant = !isCurrentUser ? (senderInfo || participant) : null;
    if (!displayParticipant) return null;
    
    if (displayParticipant.avatarUrl) {
      return (
        <div 
          className="message-avatar" 
          style={{ backgroundImage: `url(${displayParticipant.avatarUrl})` }}
        />
      );
    }
    
    const initial = displayParticipant.firstName?.charAt(0) || 
                   displayParticipant.lastName?.charAt(0) || 
                   '?';
    const avatarColor = displayParticipant.avatarColor || 
                       `hsl(${(initial.charCodeAt(0) * 10 % 360)}, 70%, 50%)`;
    return (
      <div 
        className="message-avatar" 
        style={{ backgroundColor: avatarColor }}
      >
        {initial.toUpperCase()}
      </div>
    );
  };

  return (
    <div className={`message-item ${isCurrentUser ? 'user' : 'other'}`}>
      {shouldShowAvatar && (
        <div className="message-avatar-container">
          {getAvatar()}
        </div>
      )}

      <div className={`message-container ${!shouldShowAvatar && !isCurrentUser ? 'no-avatar' : ''}`}>
        {shouldShowSender && (
          <div className="message-sender">
            {(senderInfo || participant)?.firstName || "Người dùng"} {(senderInfo || participant)?.lastName || "không xác định"}
          </div>
        )}
        {renderMessageContent()}
      </div>
    </div>
  );
};

export default MessageItem;