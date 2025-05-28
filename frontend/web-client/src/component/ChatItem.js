import React from "react";
import { FaCheck, FaCheckDouble, FaUsers, FaVolumeMute } from "react-icons/fa";
import "../pages/styles/ChatItem.css";

const ChatItem = ({ chat, participant, userStatuses, isActive, onSelect }) => {
  // Kiểm tra xem có phải là nhóm hay không
  const isGroupChat = chat?.isGroupChat || false;

  // Format timestamp từ tin nhắn cuối cùng
  const formatLastMessageTime = () => {
    if (!chat.lastUpdated) return "";
    
    try {
      let timestamp;
      if (chat.lastUpdated.seconds) {
        timestamp = new Date(chat.lastUpdated.seconds * 1000);
      } else {
        timestamp = new Date(chat.lastUpdated);
      }
      
      if (isNaN(timestamp.getTime())) return "";

      const now = new Date();
      const diffDays = Math.floor((now - timestamp) / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((now - timestamp) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((now - timestamp) / (1000 * 60));
      
      if (diffDays > 7) {
        // Ngày tháng nếu đã hơn 7 ngày
        return `${timestamp.getDate()}/${timestamp.getMonth() + 1}`;
      } else if (diffDays > 0) {
        // Số ngày nếu còn trong tuần
        if (diffDays === 1) return "Hôm qua";
        return `${diffDays} ngày`;
      } else if (diffHours > 0) {
        // Số giờ nếu trong ngày
        return `${diffHours} giờ`;
      } else if (diffMinutes > 0) {
        // Số phút nếu trong giờ
        return `${diffMinutes} phút`;
      } else {
        // Vừa xong nếu dưới 1 phút
        return "Vừa xong";
      }
    } catch (error) {
      console.error("Lỗi format timestamp:", error);
      return "";
    }
  };
  
  // Xử lý tin nhắn cuối cùng để hiển thị
  const getLastMessagePreview = () => {
    // Kiểm tra nếu không có lastMessage hoặc lastMessage là undefined/null
    if (!chat || !chat.lastMessage) {
      return "Bắt đầu cuộc trò chuyện";
    }
    
    // Xử lý các loại tin nhắn đặc biệt
    if (chat.lastMessage.type === "image") return "🖼️ Hình ảnh";
    if (chat.lastMessage.type === "file") return "📎 Tệp đính kèm";
    
    // Kiểm tra và lấy nội dung tin nhắn từ các trường khác nhau
    let messageContent = "";
    
    // Xử lý trường hợp lastMessage là một mảng
    if (Array.isArray(chat.lastMessage)) {
      // Lấy phần tử cuối cùng trong mảng (tin nhắn mới nhất)
      if (chat.lastMessage.length > 0) {
        const lastMsg = chat.lastMessage[chat.lastMessage.length - 1];
        
        if (typeof lastMsg === 'string') {
          messageContent = lastMsg;
        } else if (lastMsg && typeof lastMsg === 'object') {
          messageContent = lastMsg.text || lastMsg.content || lastMsg.message || '';
          
          // Kiểm tra loại của tin nhắn
          if (lastMsg.type === "image") return "🖼️ Hình ảnh";
          if (lastMsg.type === "file" || lastMsg.type === "document") {
            return lastMsg.fileName ? `📎 ${lastMsg.fileName}` : "📎 Tệp đính kèm";
          }
        }
      }
    }
    // Xử lý trường hợp lastMessage là một object
    else if (typeof chat.lastMessage === 'object') {
      messageContent = chat.lastMessage.text || chat.lastMessage.content || chat.lastMessage.message || '';
    }
    // Xử lý trường hợp lastMessage là string
    else if (typeof chat.lastMessage === 'string') {
      messageContent = chat.lastMessage;
    }
    
    // Sử dụng lastMessageText ở mức chat nếu vẫn không tìm thấy nội dung
    if (!messageContent && chat.lastMessageText) {
      messageContent = chat.lastMessageText;
    }
    
    // Nếu không tìm thấy nội dung tin nhắn
    if (!messageContent) {
      return "Không có nội dung tin nhắn";
    }
    
    // Giới hạn độ dài tin nhắn hiển thị
    return messageContent.length > 35 ? messageContent.substring(0, 35) + "..." : messageContent;
  };
  
  // Tạo gradient background cho avatar
  const getAvatarBackground = () => {
    if (isGroupChat) {
      return "#7E57C2"; // Màu cho nhóm
    }
    
    if (!participant || !participant.firstName) {
      return "#9575CD"; // Màu mặc định
    }
    
    // Tạo màu từ tên người dùng
    const nameHash = participant.firstName.charCodeAt(0) + 
                     (participant.lastName ? participant.lastName.charCodeAt(0) : 0);
    
    const hue = nameHash % 360;
    return `hsl(${hue}, 60%, 45%)`; // Màu dựa trên tên
  };
  
  // Lấy chữ cái đầu cho avatar
  const getAvatarInitials = () => {
    if (isGroupChat) {
      return chat.groupName?.charAt(0) || "G";
    }
    
    if (!participant) return "?";
    
    return participant.firstName?.charAt(0) || "";
  };

  return (
    <div 
      className={`chat-item ${isActive ? 'active' : ''} ${chat.unread > 0 ? 'unread' : ''}`}
      onClick={() => onSelect(chat)}
    >
      <div className="avatar-container">
        {participant?.avatarUrl && !isGroupChat ? (
          <div 
            className="avatar" 
            style={{ backgroundImage: `url(${participant.avatarUrl})` }}
          ></div>
        ) : (
          <div 
            className="avatar" 
            style={{ backgroundColor: getAvatarBackground() }}
          >
            {isGroupChat ? <FaUsers /> : <span>{getAvatarInitials()}</span>}
          </div>
        )}
        {participant?.isOnline && !isGroupChat && <span className="status-indicator"></span>}
      </div>
      
      <div className="chat-details">
        <div className="chat-header-row">
          <span className="chat-name">
            {isGroupChat 
              ? (chat.groupName || "Nhóm không tên") 
              : (participant 
                ? `${participant.firstName || ""} ${participant.lastName || ""}` 
                : "Đang tải...")}
          </span>
          <span className="timestamp">{formatLastMessageTime()}</span>
        </div>
        
        <div className="chat-footer-row">
          <span className="last-message">
            {/* Thêm tiền tố nếu là nhóm và không phải tin nhắn của người dùng hiện tại */}
            {isGroupChat && chat.lastMessage && !chat.lastMessage.isMine && !chat.lastMessage.isCurrentUser && (
              <span className="sender-prefix">
                {chat.lastMessage.senderName?.split(' ')[0]} 
              </span>
            )}
            {getLastMessagePreview()}
          </span>
          
          <div className="chat-indicators">
            {chat.muted && <FaVolumeMute className="muted-icon" />}
            {chat.unread > 0 ? (
              <span className="unread-count">{chat.unread > 9 ? '9+' : chat.unread}</span>
            ) : chat.lastMessageSeen ? (
              <FaCheckDouble className="seen-icon" />
            ) : (
              <FaCheck className="delivered-icon" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatItem;