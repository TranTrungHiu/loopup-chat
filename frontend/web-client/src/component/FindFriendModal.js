import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Alert,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Chat as ChatIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const FindFriendModal = ({ isOpen, onClose, uid, token }) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const [friendList, setFriendList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen, token, uid]);

  const fetchFriends = async () => {
    if (!uid) {
      console.error("UID không tồn tại trong localStorage.");
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch(`http://localhost:8080/api/friends/list/${uid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`Lỗi HTTP: ${res.status}`);
      }
      const data = await res.json();
      console.log("Danh sách bạn bè:", data);
      setFriendList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi lấy danh sách bạn bè:", err);
      setFriendList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail) return;
    
    try {
      setIsLoading(true);
      setSearchPerformed(true);
      
      const res = await fetch(
        `http://localhost:8080/api/user/search?email=${searchEmail}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.warn("Người dùng không tìm thấy");
        setFoundUser(null);
        setShowNotFound(true);
        setTimeout(() => setShowNotFound(false), 3000);
        return;
      }

      const user = await res.json();
      console.log("Người dùng tìm được:", user);
      setFoundUser(user);

      const checkRes = await fetch(
        `http://localhost:8080/api/friends/status/${uid}/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await checkRes.json();
      console.log("Trạng thái bạn bè:", result);
      setIsFriend(result.status);
    } catch (err) {
      console.error("Lỗi tìm người dùng:", err);
      setFoundUser(null);
      setShowNotFound(true);
      setTimeout(() => setShowNotFound(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:8080/api/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId1: uid,
          userId2: foundUser.id,
        }),
      });

      if (!res.ok) {
        const errorMessage = await res.text();
        console.error("Lỗi gửi lời mời kết bạn:", errorMessage);
        alert(errorMessage);
        return;
      }

      setIsFriend("pending");
      alert("Lời mời kết bạn đã được gửi.");
    } catch (err) {
      console.error("Lỗi gửi lời mời kết bạn:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async (friend) => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:8080/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user1: uid,
          user2: friend.id,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Lỗi từ API:", errorText);
        throw new Error("Lỗi khi tạo hoặc lấy cuộc trò chuyện");
      }

      onClose();

    } catch (err) {
      console.error("Lỗi khi bắt đầu cuộc trò chuyện:", err);
      alert("Không thể bắt đầu cuộc trò chuyện, vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm"
      PaperProps={{
        elevation: 3,
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', py: 2 }}>
        Tìm bạn
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Email người dùng"
            variant="outlined"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchUser();
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button 
              variant="contained" 
              onClick={handleSearchUser}
              disabled={isLoading || !searchEmail}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              Tìm kiếm
            </Button>
          </Box>
        </Box>

        {isLoading && !searchPerformed && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}
        
        {searchPerformed && showNotFound && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Không tìm thấy người dùng với email này
          </Alert>
        )}

        {foundUser && (
          <Box sx={{ 
            p: 2, 
            border: 1, 
            borderColor: 'divider', 
            borderRadius: 1, 
            mb: 2 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                {foundUser.firstName ? foundUser.firstName.charAt(0) : <PersonIcon />}
              </Avatar>
              <Typography variant="subtitle1">
                {foundUser.lastName} {foundUser.firstName}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              {isFriend === "accepted" && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ChatIcon />}
                  onClick={() => handleStartChat(foundUser)}
                  disabled={isLoading}
                >
                  Nhắn tin
                </Button>
              )}
              {isFriend === "pending" && (
                <Button
                  variant="outlined"
                  disabled
                >
                  Đã gửi kết bạn
                </Button>
              )}
              {isFriend === "none" && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PersonAddIcon />}
                  onClick={handleSendRequest}
                  disabled={isLoading}
                >
                  Kết bạn
                </Button>
              )}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" sx={{ mb: 2 }}>
          Danh sách bạn bè
        </Typography>
        
        {friendList.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Bạn chưa có bạn bè nào
            </Typography>
          </Box>
        ) : (
          <List sx={{ 
            maxHeight: 300, 
            overflow: 'auto',
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: 1,
            borderColor: 'divider'
          }}>
            {friendList.map((friend) => (
              <ListItem 
                key={friend.id}
                secondaryAction={
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ChatIcon />}
                    onClick={() => handleStartChat(friend)}
                  >
                    Chat
                  </Button>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {friend.firstName ? friend.firstName.charAt(0).toUpperCase() : <PersonIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={`${friend.lastName} ${friend.firstName}`}
                  secondary={friend.email || ""}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FindFriendModal;