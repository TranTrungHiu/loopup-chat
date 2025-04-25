import React, { useState, useEffect, useCallback } from "react";
import "../pages/styles/FriendList.css"; // Đường dẫn đến file CSS của bạn
import { FaSearch, FaSyncAlt, FaUserFriends, FaComments } from "react-icons/fa";
import { TextField, InputAdornment, Avatar, Button, Tooltip, CircularProgress, List, ListItem, ListItemAvatar, ListItemText, ListItemSecondaryAction, IconButton, Chip, Divider, Fade, Box } from "@mui/material";
import { styled } from "@mui/material/styles";

// Styled components
const SearchField = styled(TextField)(({ theme }) => ({
  margin: '10px 0',
  width: '100%',
  '& .MuiOutlinedInput-root': {
    borderRadius: 25,
    backgroundColor: '#f0f2f5',
    '&:hover': {
      backgroundColor: '#e4e6e9',
    },
    '&.Mui-focused': {
      backgroundColor: '#fff',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    },
  },
}));

const FriendAvatar = styled(Avatar)(({ theme }) => ({
  width: 50,
  height: 50,
  border: '2px solid #fff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
}));

const ChatButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: '#1877f2',
  color: '#fff',
  '&:hover': {
    backgroundColor: '#0d6efd',
  },
}));

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  color: '#65676b',
}));

const FriendList = ({ uid, token, onStartChat, onClose }) => {
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
          Authorization: `Bearer ${token}`,
        },
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
    const filtered = friends.filter((friend) => {
      const fullName = `${friend.firstName} ${friend.lastName}`.toLowerCase();
      const reverseName = `${friend.lastName} ${friend.firstName}`.toLowerCase();
      return fullName.includes(query) || reverseName.includes(query) || friend.email?.toLowerCase().includes(query);
    });

    setFilteredFriends(filtered);
  }, [searchQuery, friends]);

  // Tạo cuộc trò chuyện mới với bạn bè
  const handleChatWithFriend = (friend) => {
    onStartChat(friend); // Bắt đầu cuộc trò chuyện
    onClose(); // Đóng sidebar sau khi chọn bạn bè
  };

  return (
    <div className="friend-sidebar">
      <div className="friend-sidebar-header">
        <h2><FaUserFriends style={{ marginRight: '10px' }} /> Danh sách bạn bè</h2>
        <Tooltip title="Làm mới danh sách" arrow>
          <Button 
            variant="contained" 
            size="small" 
            color="primary" 
            onClick={fetchFriends} 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FaSyncAlt />}
            sx={{ minWidth: 'auto', borderRadius: '20px' }}
          >
            {loading ? "" : "Làm mới"}
          </Button>
        </Tooltip>
      </div>

      <div className="friend-search">
        <SearchField
          placeholder="Tìm kiếm bạn bè"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FaSearch />
              </InputAdornment>
            ),
          }}
        />
      </div>

      {loading ? (
        <Fade in={loading}>
          <div className="friend-loading">
            <CircularProgress size={50} />
            <p>Đang tải danh sách bạn bè...</p>
          </div>
        </Fade>
      ) : error ? (
        <div className="friend-error">
          <p>{error}</p>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={fetchFriends}
          >
            Thử lại
          </Button>
        </div>
      ) : filteredFriends.length > 0 ? (
        <List sx={{ width: '100%', bgcolor: 'background.paper', padding: 0 }}>
          {filteredFriends.map((friend, index) => (
            <React.Fragment key={friend.id || friend.uid}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <FriendAvatar
                    src={friend.avatarUrl}
                    alt={`${friend.firstName} ${friend.lastName}`}
                    sx={{
                      bgcolor: friend.avatarUrl ? undefined : getAvatarColor(friend.firstName, friend.lastName)
                    }}
                  >
                    {!friend.avatarUrl && getInitials(friend.firstName, friend.lastName)}
                  </FriendAvatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <span className="friend-name-text">
                      {friend.firstName} {friend.lastName}
                      {friend.isOnline && 
                        <Chip 
                          label="online" 
                          color="success" 
                          size="small" 
                          sx={{ ml: 1, height: 20, fontSize: '0.6rem' }}
                        />
                      }
                    </span>
                  }
                  secondary={friend.email || "Không có email"}
                />
                <ListItemSecondaryAction>
                  <Tooltip title={`Nhắn tin với ${friend.firstName}`} arrow>
                    <ChatButton 
                      edge="end" 
                      aria-label="chat"
                      onClick={() => handleChatWithFriend(friend)}
                    >
                      <FaComments />
                    </ChatButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
              {index < filteredFriends.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <EmptyState>
          <FaUserFriends size={50} style={{ opacity: 0.5, marginBottom: 20 }} />
          <p>Chưa có bạn bè nào</p>
          <p>Hãy kết bạn để bắt đầu trò chuyện</p>
        </EmptyState>
      )}
    </div>
  );
};

function getAvatarColor(firstName, lastName) {
  const nameString = `${firstName || ""}${lastName || ""}`;
  let hash = 0;
  for (let i = 0; i < nameString.length; i++) {
    hash = nameString.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = Math.abs(hash % 360); // hue
  return `hsl(${h}, 70%, 75%)`; // pastel màu nhẹ
}

function getInitials(firstName, lastName) {
  const firstInitial = firstName ? firstName.charAt(0) : "";
  const lastInitial = lastName ? lastName.charAt(0) : "";
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

export default FriendList;