import React from "react";
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Divider,
  Button
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Chat as ChatIcon
} from '@mui/icons-material';

const ChatList = ({
  chats,
  isLoading,
  error,
  currentChat,
  participantsInfo,
  onChatSelect,
  onRetry,
  onFindFriend,
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          py: 4
        }}
      >
        <Typography variant="body1" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={onRetry}
        >
          Thử lại
        </Button>
      </Box>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          py: 4
        }}
      >
        <Typography variant="body1" sx={{ mb: 2 }}>
          Chưa có cuộc trò chuyện nào
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<SearchIcon />}
          onClick={onFindFriend}
        >
          Tìm bạn bè
        </Button>
      </Box>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        maxHeight: 'calc(100vh - 220px)', 
        overflow: 'auto',
        backgroundColor: 'background.paper',
        borderRadius: 2
      }}
    >
      <List sx={{ p: 0 }}>
        {chats.map((chat) => {
          const isActive = currentChat && currentChat.chatId === chat.chatId;
          const participant = participantsInfo[chat.chatId];
          const name = participant
            ? `${participant.firstName} ${participant.lastName}`
            : "Đang tải...";
          const lastMessage = chat.lastMessage || "";
          const timestamp = chat.lastMessageTime
            ? new Date(chat.lastMessageTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          return (
            <React.Fragment key={chat.chatId}>
              <ListItem
                button
                alignItems="flex-start"
                onClick={() => onChatSelect(chat)}
                sx={{
                  bgcolor: isActive ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                  py: 1.5,
                  px: 2
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: participant?.isDefault ? 'grey.400' : 'primary.main' }}>
                    {name ? name.charAt(0).toUpperCase() : <ChatIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle1"
                      noWrap
                      sx={{
                        fontWeight: chat.unread ? 'bold' : 'normal',
                      }}
                    >
                      {name}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: 'inline',
                          maxWidth: '70%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: chat.unread ? 'medium' : 'normal',
                        }}
                      >
                        {lastMessage}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {timestamp}
                      </Typography>
                    </Box>
                  }
                />
                {chat.unread && (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      bgcolor: 'primary.main',
                      borderRadius: '50%',
                      ml: 1,
                      mt: 2,
                    }}
                  />
                )}
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          );
        })}
      </List>
    </Paper>
  );
};

export default ChatList;