import React from "react";

const ChatItem = React.memo(({ chat, isActive, participant, onSelect }) => {
  const isGroupChat = chat.isGroupChat || false;

  // Tạo chữ cái đầu cho avatar
  const getInitials = () => {
    if (isGroupChat) {
      const groupName = chat.groupName || "Nhóm";
      return groupName.charAt(0).toUpperCase();
    }

    if (participant?.isDefault) return "?";

    const firstInit = participant?.firstName ? participant.firstName[0] : "";
    const lastInit = participant?.lastName ? participant.lastName[0] : "";
    return (firstInit + lastInit).toUpperCase();
  };

  // Tạo màu nền cho avatar dựa trên ID (nhất quán cho mỗi người dùng)
  const getAvatarColor = () => {
    if (isGroupChat) {
      // Màu cố định cho chat nhóm
      return "#64b5f6"; // Màu xanh nhạt cho nhóm
    }

    if (participant?.isDefault) return "#e0e0e0";

    // Tạo màu dựa trên ID hoặc tên
    const seed = participant?.id || (participant?.firstName + participant?.lastName);
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Chuyển hash thành màu HSL có tính thẩm mỹ (màu pastel)
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 75%)`;
  };

  const displayName = isGroupChat
    ? chat.groupName || "Nhóm không tên"
    : participant?.isDefault
    ? "Người dùng không xác định"
    : `${participant?.firstName || ""} ${participant?.lastName || ""}`;

  return (
    <div
      className={`chat-item ${isActive ? "active" : ""}`}
      onClick={() => onSelect(chat)}
    >
      <div
        className={`chat-avatar ${
          isGroupChat ? "group-avatar" : participant?.isDefault ? "default-avatar" : ""
        }`}
        style={
          participant?.avatarUrl && !isGroupChat
            ? { backgroundImage: `url(${participant.avatarUrl})` }
            : { backgroundColor: getAvatarColor() }
        }
      >
        {(!participant?.avatarUrl || isGroupChat) && (
          <span className="avatar-text">{getInitials()}</span>
        )}
      </div>
      <div className="chat-info">
        <p className="chat-name">{displayName}</p>
        <p className="chat-preview">{chat.lastMessage || "Không có tin nhắn"}</p>
      </div>
      <span className="chat-time">
        {chat.lastUpdated
          ? (() => {
              try {
                const date = new Date(
                  chat.lastUpdated.seconds
                    ? chat.lastUpdated.seconds * 1000
                    : chat.lastUpdated
                );

                if (isNaN(date.getTime())) {
                  return "";
                }

                const now = new Date();
                const diffInMs = now - date;
                const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
                const diffInHours = Math.floor(diffInMinutes / 60);

                if (diffInMinutes < 60) {
                  return `${diffInMinutes} phút trước`;
                } else {
                  return `${diffInHours} giờ trước`;
                }
              } catch (error) {
                console.error("Error formatting date:", error);
                return "";
              }
            })()
          : ""}
      </span>
    </div>
  );
});

export default ChatItem;