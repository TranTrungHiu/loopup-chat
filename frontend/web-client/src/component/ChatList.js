import React, { useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import ChatItem from './ChatItem'; // Đường dẫn đến component ChatItem

const ChatList = ({ 
  chats, 
  isLoading, 
  error, 
  currentChat, 
  participantsInfo, 
  onChatSelect, 
  onRetry, 
  onFindFriend
}) => {
  // Render từng item trong danh sách chat
  const renderRow = useCallback(({ index, style }) => {
    const chat = chats[index];
    const participant = participantsInfo[chat.chatId] || {
      firstName: "Người dùng",
      lastName: "không xác định",
      isDefault: true,
    };
    
    const isActive = currentChat && currentChat.chatId === chat.chatId;
    
    return (
      <div style={style}>
        <ChatItem 
          chat={chat}
          isActive={isActive}
          participant={participant}
          onSelect={onChatSelect}
        />
      </div>
    );
  }, [chats, currentChat, participantsInfo, onChatSelect]);

  // Hiển thị trạng thái loading
  if (isLoading) {
    return (
      <div className="loading-chats">
        <div className="loading-spinner"></div>
        <p>Đang tải danh sách chat...</p>
      </div>
    );
  }

  // Hiển thị lỗi
  if (error) {
    return (
      <div className="chat-error">
        <p>Lỗi: {error}</p>
        <button onClick={onRetry} className="retry-button">
          Thử lại
        </button>
      </div>
    );
  }

  // Hiển thị khi không có chat
  if (!chats || chats.length === 0) {
    return (
      <div className="no-chats">
        <div className="empty-state-icon">💬</div>
        <p>Bạn chưa có cuộc trò chuyện nào</p>
        <button className="find-friend-btn" onClick={onFindFriend}>
          Tìm bạn
        </button>
      </div>
    );
  }

  // Sử dụng virtualization khi có nhiều chat (> 10)
  if (chats.length > 10) {
    return (
      <List
        className="virtual-chat-list"
        height={500}
        itemCount={chats.length}
        itemSize={72}
        width="100%"
      >
        {renderRow}
      </List>
    );
  }

  // Render thông thường cho số lượng chat nhỏ
  return (
    <div className="chat-items">
      {chats.map((chat) => {
        const participant = participantsInfo[chat.chatId] || {
          firstName: "Người dùng",
          lastName: "không xác định",
          isDefault: true,
        };
        
        const isActive = currentChat && currentChat.chatId === chat.chatId;
        
        return (
          <ChatItem 
            key={chat.chatId || `chat-${Math.random()}`}
            chat={chat}
            isActive={isActive}
            participant={participant}
            onSelect={onChatSelect}
          />
        );
      })}
    </div>
  );
};

export default React.memo(ChatList);