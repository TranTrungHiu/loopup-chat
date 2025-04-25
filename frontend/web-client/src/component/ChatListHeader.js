import React from "react";
import { FaSearch, FaUserFriends, FaUsers, FaSync } from "react-icons/fa";
import "../pages/styles/ChatListHeader.css";

const ChatListHeader = ({ 
  searchQuery, 
  onSearchChange, 
  onCreateGroup, 
  onFindFriends, 
  onRefresh, 
  isLoading 
}) => {
  return (
    <div className="chat-list-header">
      <div className="chat-list-title">
        <h2>Trò Chuyện</h2>
        <div className="header-actions">
          <button 
            className="header-btn refresh-btn" 
            onClick={onRefresh}
            disabled={isLoading}
            title="Làm mới"
          >
            <FaSync className={isLoading ? "spinning" : ""} />
          </button>
          <button 
            className="header-btn" 
            onClick={onCreateGroup}
            title="Tạo nhóm chat mới"
          >
            <FaUsers />
          </button>
          <button 
            className="header-btn" 
            onClick={onFindFriends}
            title="Tìm bạn bè"
          >
            <FaUserFriends />
          </button>
        </div>
      </div>
      
      <div className="search-container">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm cuộc trò chuyện..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button 
            className="clear-search" 
            onClick={() => onSearchChange("")}
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatListHeader;