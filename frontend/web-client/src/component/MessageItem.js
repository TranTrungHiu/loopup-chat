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

  useEffect(() => {
    // Debug: Log tin nhắn để hiểu cấu trúc khi gặp vấn đề
    if (!message || !message.message) {
      console.log('Debugging message structure:', message);
    }
  }, [message]);
  
  // Kiểm tra xem tin nhắn này có cần hiển thị avatar không
  const shouldShowAvatar = showAvatar && !isCurrentUser;
  
  // Kiểm tra xem tin nhắn này có cần hiển thị tên người gửi không
  const shouldShowSender = showAvatar && !isCurrentUser && participant;
  
  // Xử lý hiển thị icon cho các loại file khác nhau
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
  
  // Improved timestamp formatting function
  const formatTime = (timestamp) => {
    if (formattedTime) return formattedTime;
    
    // Handle different timestamp formats
    let date;
    
    if (!timestamp) {
      return '';
    }
    
    try {
      // If it's a number (unix timestamp in seconds), convert to milliseconds
      if (typeof timestamp === 'number') {
        // Check if timestamp is in seconds (10 digits) and convert to milliseconds if needed
        const isInSeconds = timestamp.toString().length === 10;
        date = new Date(isInSeconds ? timestamp * 1000 : timestamp);
      } 
      // If it's a string, try to parse it
      else if (typeof timestamp === 'string') {
        // Try parsing as ISO string
        date = new Date(timestamp);
        
        // If invalid, try parsing as Firebase timestamp
        if (isNaN(date.getTime()) && timestamp.seconds) {
          date = new Date(timestamp.seconds * 1000);
        }
      } 
      // If it's a Firebase timestamp object with seconds and nanoseconds
      else if (timestamp && timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } 
      // If it's already a Date object
      else if (timestamp instanceof Date) {
        date = timestamp;
      } 
      else {
        date = new Date();
      }
      
      // Check if the date is valid
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
  
  // Trạng thái tin nhắn
  const renderMessageStatus = () => {
    // Nếu tin nhắn đã được đọc bởi ít nhất một người khác
    if (message.readBy && Object.keys(message.readBy).length > 0) {
      // Tìm những người đã đọc không phải người gửi
      const readersNotSender = Object.keys(message.readBy).filter(
        readerId => readerId !== message.sender
      );
      
      // Nếu có người đã đọc (không phải người gửi)
      if (readersNotSender.length > 0) {
        return (
          <span className="message-status-icon seen" title="Đã xem">
            <FaCheckCircle />
          </span>
        );
      }
    }
    
    // Mặc định: đã gửi
    return (
      <span className="message-status-icon sent" title="Đã gửi">
        <FaCheck />
      </span>
    );
  };

  // Helper function to safely display message content
  const renderMessageContent = () => {
    // Nếu tin nhắn không tồn tại
    if (!message) {
      return 'No message data';
    }
    
    // Nếu là tin nhắn hình ảnh
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
          
          {/* Hiển thị thời gian bên trong bubble tin nhắn hình ảnh */}
          <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
            <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
            {isCurrentUser && renderMessageStatus()}
          </div>
        </div>
      );
    }
    
    // Nếu là tin nhắn file
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
          
          {/* Hiển thị thời gian bên trong bubble tin nhắn file */}
          <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
            <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
            {isCurrentUser && renderMessageStatus()}
          </div>
        </div>
      );
    }
    
    // Tin nhắn văn bản - trích xuất nội dung từ nhiều nguồn khác nhau
    let textContent = "";
    
    // Kiểm tra nội dung tin nhắn trực tiếp
    if (typeof message === 'string') {
      textContent = message;
    } else {
      // Kiểm tra tất cả các trường có thể chứa nội dung tin nhắn
      if (message.message !== undefined && message.message !== null) {
        textContent = String(message.message); // Chuyển đổi thành string trong mọi trường hợp
      } else if (message.content) {
        textContent = String(message.content);
      } else if (message.text) {
        textContent = String(message.text);
      } else if (message.data && typeof message.data === 'string') {
        textContent = message.data;
      }
    }
    
    // Nếu vẫn không có nội dung và bật chế độ debug
    if (!textContent && typeof message === 'object') {
      console.debug('Debug message structure:', Object.keys(message));
      
      // Tạo chuỗi chứa thông tin về tất cả các trường trong đối tượng tin nhắn
      const messageFields = Object.entries(message)
        .filter(([key]) => key !== 'readBy') // Loại bỏ trường readBy phức tạp
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
            
            {/* Hiển thị thời gian trong debug message */}
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
            
            {/* Hiển thị thời gian trong message không có nội dung */}
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
        
        {/* Hiển thị thời gian bên trong bubble tin nhắn văn bản */}
        <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
          <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
          {isCurrentUser && renderMessageStatus()}
        </div>
      </div>
    );
  };

  // Get appropriate avatar for the participant
  const getAvatar = () => {
    if (!participant) return null;
    
    if (participant.avatarUrl) {
      return (
        <div 
          className="message-avatar" 
          style={{ backgroundImage: `url(${participant.avatarUrl})` }}
        />
      );
    }
    
    // Use initial letter if no avatar
    const initial = participant.firstName?.charAt(0) || 
                    participant.lastName?.charAt(0) || 
                    '?';
                    
    const avatarColor = participant.avatarColor || 
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
      {/* Avatar của người gửi */}
      {shouldShowAvatar && (
        <div className="message-avatar-container">
          {getAvatar()}
        </div>
      )}

      {/* Container nội dung tin nhắn */}
      <div className={`message-container ${!shouldShowAvatar && !isCurrentUser ? 'no-avatar' : ''}`}>
        {/* Tên người gửi */}
        {shouldShowSender && participant && (
          <div className="message-sender">
            {participant.firstName} {participant.lastName}
          </div>
        )}

        {/* Nội dung tin nhắn */}
        {renderMessageContent()}
      </div>
    </div>
  );
};

export default MessageItem;