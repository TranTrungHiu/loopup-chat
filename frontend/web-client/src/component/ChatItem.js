import React from 'react';

// Component riêng cho mỗi item chat
const ChatItem = React.memo(({ 
  chat, 
  isActive, 
  participant, 
  onSelect 
}) => {
  // Tạo chữ cái đầu cho avatar
  const getInitials = () => {
    if (participant.isDefault) return "?";
    
    const firstInit = participant.firstName ? participant.firstName[0] : '';
    const lastInit = participant.lastName ? participant.lastName[0] : '';
    
    return (firstInit + lastInit).toUpperCase();
  };

  // Tạo màu nền cho avatar dựa trên ID (nhất quán cho mỗi người dùng)
  const getAvatarColor = () => {
    if (participant.isDefault) return '#e0e0e0';
    
    // Tạo màu dựa trên ID hoặc tên
    const seed = participant.id || (participant.firstName + participant.lastName);
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Chuyển hash thành màu HSL có tính thẩm mỹ (màu pastel)
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 75%)`;
  };

  return (
    <div
      className={`chat-item ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(chat)}
    >
      <div
        className={`chat-avatar ${participant.isDefault ? 'default-avatar' : ''}`}
        style={
          participant.avatarUrl
            ? { backgroundImage: `url(${participant.avatarUrl})` }
            : { backgroundColor: getAvatarColor() }
        }
      >
        {!participant.avatarUrl && (
          <span className="avatar-text">{getInitials()}</span>
        )}
      </div>
      <div className="chat-info">
        <p className="chat-name">
          {participant.isDefault
            ? "Người dùng không xác định"
            : `${participant.firstName || ""} ${participant.lastName || ""}`}
        </p>
        <p className="chat-preview">
          {chat.lastMessage || "Không có tin nhắn"}
        </p>
      </div>
      <span className="chat-time">
        {chat.lastUpdated
          ? new Date(chat.lastUpdated).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : ""}
      </span>
    </div>
  );
});

export default ChatItem;