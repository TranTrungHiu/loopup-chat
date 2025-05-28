import React from "react";
import ChatItem from "./ChatItem";
import { FaCommentSlash, FaSpinner, FaExclamationCircle, FaSearch } from "react-icons/fa";
import "../pages/styles/ChatList.css";

const ChatList = ({
  chats,
  isLoading,
  error,
  currentChat,
  participantsInfo,
  userStatuses,
  onChatSelect,
  onRetry,
  onFindFriend,
  uid
}) => {
  
  // Render trạng thái trống
  const renderEmptyState = () => (
    <div className="chat-list-empty-state">
      <FaCommentSlash className="empty-icon" />
      <h3>Chưa có cuộc trò chuyện nào</h3>
      <p>Bắt đầu trò chuyện với bạn bè hoặc tạo nhóm chat mới</p>
      <button className="find-friend-button" onClick={onFindFriend}>
        <FaSearch /> Tìm bạn bè
      </button>
    </div>
  );
  
  // Render trạng thái đang tải
  const renderLoadingState = () => (
    <div className="chat-list-loading-state">
      <div className="loading-spinner">
      </div>
      <p>Đang tải danh sách chat...</p>
    </div>
  );
  
  // Render trạng thái lỗi
  const renderErrorState = () => (
    <div className="chat-list-error-state">
      <FaExclamationCircle className="error-icon" />
      <h3>Không thể tải danh sách chat</h3>
      <p>{error || "Đã có lỗi xảy ra khi tải danh sách chat"}</p>
      <button className="retry-button" onClick={onRetry}>
        Thử lại
      </button>
    </div>
  );

  // Sắp xếp chat theo thời gian cập nhật gần nhất
  const sortedChats = [...(chats || [])].sort((a, b) => {
    const timeA = a.lastUpdated ? 
      (a.lastUpdated.seconds ? a.lastUpdated.seconds * 1000 : a.lastUpdated) : 0;
    const timeB = b.lastUpdated ? 
      (b.lastUpdated.seconds ? b.lastUpdated.seconds * 1000 : b.lastUpdated) : 0;
    return timeB - timeA;
  });

  return (
    <div className="chat-list-container">
      {isLoading ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : sortedChats.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="chat-list-items">
          {sortedChats.map((chat) => {
            const participant = participantsInfo[chat.chatId];
            const isActive = currentChat && currentChat.chatId === chat.chatId;
            
            // Tính số tin nhắn chưa đọc
            const unread = chat.unreadCount ? chat.unreadCount[uid] || 0 : 0;
            
            return (
              <ChatItem
                key={chat.chatId}
                chat={{
                  ...chat,
                  unread: unread,
                  lastMessageSeen: chat.lastMessageRead && chat.lastMessageRead[uid]
                }}
                participant={participant}
                isActive={isActive}
                onSelect={onChatSelect}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatList;