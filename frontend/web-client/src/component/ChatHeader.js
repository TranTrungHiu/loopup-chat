import React from "react";
import { FaEllipsisV, FaInfoCircle, FaSearch, FaVideo, FaUsers, FaPhoneAlt } from "react-icons/fa";
import "../pages/styles/ChatHeader.css";

const ChatHeader = ({ currentChat, currentParticipant, onInfoClick, onVideoCall, onSearch }) => {
  // Xác định xem chat có phải là nhóm hay không
  const isGroupChat = currentChat?.isGroupChat || false;
  
  // Lấy status hiện tại của người dùng
  const getUserStatus = () => {
    if (isGroupChat) {
      const participantCount = currentChat?.participants ? Object.keys(currentChat.participants).length : 0;
      return `${participantCount} thành viên`;
    }
    
    if (!currentParticipant) return "Không hoạt động";
    
    if (currentParticipant.isLoading) return "Đang tải...";
    if (currentParticipant.isOnline) return "Đang hoạt động";
    
    if (currentParticipant.lastSeen) {
      try {
        let lastSeen;
        if (typeof currentParticipant.lastSeen === 'object' && currentParticipant.lastSeen.seconds) {
          lastSeen = new Date(currentParticipant.lastSeen.seconds * 1000);
        } else {
          lastSeen = new Date(currentParticipant.lastSeen);
        }
        
        if (!isNaN(lastSeen.getTime())) {
          const now = new Date();
          const diffMs = now - lastSeen;
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);
          
          if (diffMins < 60) {
            return `Hoạt động ${diffMins} phút trước`;
          } else if (diffHours < 24) {
            return `Hoạt động ${diffHours} giờ trước`;
          } else {
            return `Hoạt động ${diffDays} ngày trước`;
          }
        }
      } catch (error) {
        console.error("Lỗi khi format lastSeen:", error);
      }
    }
    
    return "Không hoạt động";
  };
  
  // Tạo gradient background cho avatar khi không có ảnh
  const getAvatarBackground = () => {
    if (isGroupChat) {
      return "#7E57C2"; // Màu cho nhóm
    }
    
    if (!currentParticipant || !currentParticipant.firstName) {
      return "#9575CD"; // Màu mặc định
    }
    
    // Tạo màu từ tên người dùng
    const nameHash = currentParticipant.firstName.charCodeAt(0) + 
                     (currentParticipant.lastName ? currentParticipant.lastName.charCodeAt(0) : 0);
    
    const hue = nameHash % 360;
    return `hsl(${hue}, 60%, 45%)`; // Màu dựa trên tên
  };
  
  // Lấy chữ cái đầu cho avatar
  const getAvatarInitials = () => {
    if (isGroupChat) {
      return currentChat.groupName?.charAt(0) || "G";
    }
    
    if (!currentParticipant) return "?";
    
    return currentParticipant.firstName?.charAt(0) || "";
  };

  return (
    <div className="chat-header">
      <div className="user-avatar-container">
        {currentParticipant?.avatarUrl && !isGroupChat ? (
          <img 
            className="user-avatar" 
            src={currentParticipant.avatarUrl} 
            alt="Avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/default-avatar.png";
            }}
          />
        ) : (
          <div 
            className="user-avatar" 
            style={{ backgroundColor: getAvatarBackground() }}
          >
            {isGroupChat ? <FaUsers /> : <span>{getAvatarInitials()}</span>}
          </div>
        )}
        
        {currentParticipant?.isOnline && !isGroupChat && 
          <span className="status-dot"></span>
        }
      </div>
      
      <div className="user-info" onClick={onInfoClick}>
        <h3 className="user-name">
          {isGroupChat 
            ? (currentChat.groupName || "Nhóm không tên") 
            : (currentParticipant 
              ? `${currentParticipant.firstName || ""} ${currentParticipant.lastName || ""}` 
              : "Đang tải...")}
        </h3>
        <p className="user-status">{getUserStatus()}</p>
      </div>
      
      <div className="actions">
        <button className="action-button" onClick={onSearch} title="Tìm kiếm">
          <FaSearch />
        </button>
        
        <button className="action-button" onClick={onVideoCall} title="Gọi video">
        <FaVideo />
      </button>
        
        <button className="action-button" onClick={onInfoClick} title="Thông tin">
          <FaInfoCircle />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;