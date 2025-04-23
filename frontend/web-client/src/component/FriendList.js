import React, { useState, useEffect, useCallback } from "react";
import "../pages/styles/FriendList.css"; // Đường dẫn đến file CSS của bạn
import { FaSearch,FaSyncAlt  } from "react-icons/fa";
const FriendList = ({ uid, token, onStartChat }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFriends, setFilteredFriends] = useState([]);

  // Lấy danh sách bạn bè
  const fetchFriends = useCallback(async () => {
    if (!uid || !token) {
      setError("UID hoặc token không tồn tại");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8080/api/friends/list/${uid}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("Danh sách bạn bè:", data);
      setFriends(Array.isArray(data) ? data : []);
      setFilteredFriends(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách bạn bè:", err);
      setError("Không thể tải danh sách bạn bè");
    } finally {
      setLoading(false);
    }
  }, [uid, token]);

  // Tải danh sách bạn bè khi component mount
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Lọc danh sách bạn bè theo tìm kiếm
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFriends(friends);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = friends.filter(friend => {
      const fullName = `${friend.firstName} ${friend.lastName}`.toLowerCase();
      const reverseName = `${friend.lastName} ${friend.firstName}`.toLowerCase();
      return fullName.includes(query) || reverseName.includes(query) || friend.email?.toLowerCase().includes(query);
    });

    setFilteredFriends(filtered);
  }, [searchQuery, friends]);

  // Tạo cuộc trò chuyện mới với bạn bè
  const handleChatWithFriend = (friend) => {
    onStartChat(friend);
  };

  return (
    <div className="friend-sidebar">
      <div className="friend-sidebar-header">        
        <h2>Danh sách bạn bè</h2>
        <button className="refresh-button" onClick={fetchFriends} disabled={loading}>
          {loading ? "⏳" : <FaSyncAlt   />}
        </button>
      </div>
      
      <div className="friend-search">
        <FaSearch className="friend-search-icon" />
        <input
          type="text"
          placeholder="Tìm bạn"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="friend-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải...</p>
        </div>
      ) : error ? (
        <div className="friend-error">
          <p>{error}</p>
          <button onClick={fetchFriends}>Thử lại</button>
        </div>
      ) : filteredFriends.length > 0 ? (
        <ul className="friend-list-sidebar">
          {filteredFriends.map((friend) => (
            <li key={friend.id} className="friend-item-sidebar">
              <div className="friend-info">
                <div 
                  className="friend-avatar"
                  style={
                    friend.avatarUrl 
                      ? { backgroundImage: `url(${friend.avatarUrl})` } 
                      : { backgroundColor: getAvatarColor(friend.firstName, friend.lastName) }
                  }
                >
                  {!friend.avatarUrl && getInitials(friend.firstName, friend.lastName)}
                </div>
                <span className="friend-name">
                  {friend.firstName} {friend.lastName}
                </span>
              </div>
              <button
                className="chat-with-friend"
                onClick={() => handleChatWithFriend(friend)}
                title={`Nhắn tin với ${friend.firstName} ${friend.lastName}`}
              >
                💬
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-friends-sidebar">
          <p>Chưa có bạn bè nào</p>
        </div>
      )}
    </div>
  );
};

// Helper functions
function getInitials(firstName, lastName) {
  const firstInitial = firstName ? firstName.charAt(0) : '';
  const lastInitial = lastName ? lastName.charAt(0) : '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

function getAvatarColor(firstName, lastName) {
  const nameString = `${firstName || ''}${lastName || ''}`;
  let hash = 0;
  for (let i = 0; i < nameString.length; i++) {
    hash = nameString.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Hue, Saturation, Lightness
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 70%, 75%)`;
}

export default FriendList;