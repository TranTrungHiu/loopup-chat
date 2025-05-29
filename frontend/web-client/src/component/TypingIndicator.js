import React from 'react';
import './styles/TypingIndicator.css';

const TypingIndicator = ({ typingUsers, currentParticipant }) => {
  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  const renderTypingText = () => {
    if (typingUsers.length === 1) {
      const userName = currentParticipant?.firstName || 'Người dùng';
      return `${userName} đang nhập...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers.length} người đang nhập...`;
    } else {
      return `${typingUsers.length} người đang nhập...`;
    }
  };

  return (
    <div className="typing-indicator">
      <div className="typing-text">
        {renderTypingText()}
      </div>
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};

export default TypingIndicator;
