import React, { useState, useRef } from "react";
import { 
  FaPaperPlane, 
  FaSmile, 
  FaPaperclip, 
  FaImage, 
  FaMicrophone
} from "react-icons/fa";
import "../pages/styles/ChatInput.css";

const ChatInput = ({ onSendMessage, onSendFile, onSendImage, isTyping, setIsTyping }) => {
  const [message, setMessage] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  
  // Xử lý gửi tin nhắn
  const handleSend = (e) => {
    e?.preventDefault();
    
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
      setIsTyping && setIsTyping(false);
    }
  };
  
  // Xử lý khi người dùng đang nhập tin nhắn
  const handleTyping = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    // Thông báo đang nhập tin nhắn
    if (setIsTyping) {
      if (value.length > 0 && !isTyping) {
        setIsTyping(true);
      } else if (value.length === 0 && isTyping) {
        setIsTyping(false);
      }
    }
  };
  
  // Xử lý khi nhấn phím enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSend(e);
    }
  };
  
  // Xử lý đính kèm file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onSendFile) {
      onSendFile(file);
    }
    // Reset input để có thể chọn cùng một file nhiều lần
    e.target.value = null;
  };
  
  // Xử lý đính kèm hình ảnh
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && onSendImage) {
      onSendImage(file);
    }
    // Reset input để có thể chọn cùng một hình ảnh nhiều lần
    e.target.value = null;
  };

  return (
    <div className="chat-input-container">
      {/* Menu đính kèm */}
      {showAttachMenu && (
        <div className="attach-menu">
          <button 
            className="attach-btn image-btn" 
            onClick={() => imageInputRef.current.click()}
            title="Gửi hình ảnh"
          >
            <FaImage />
          </button>
          <button 
            className="attach-btn file-btn" 
            onClick={() => fileInputRef.current.click()}
            title="Gửi file"
          >
            <FaPaperclip />
          </button>
        </div>
      )}
      
      {/* Input ẩn để chọn file */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      
      {/* Input ẩn để chọn hình ảnh */}
      <input
        type="file"
        ref={imageInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleImageChange}
      />
      
      {/* Form nhập tin nhắn */}
      <div className="input-area">
        <button 
          className="emoji-btn" 
          type="button"
        >
          <FaSmile />
        </button>
        
        <textarea
          className="message-input"
          placeholder="Tin nhắn..."
          value={message}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        
        <button 
          className="attach-toggle-btn" 
          type="button"
          onClick={() => setShowAttachMenu(!showAttachMenu)}
        >
          <FaPaperclip />
        </button>
        
        {message.trim() ? (
          <button 
            className="send-btn" 
            type="button"
            onClick={handleSend}
          >
            <FaPaperPlane />
          </button>
        ) : (
          <button 
            className="voice-btn" 
            type="button"
          >
            <FaMicrophone />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;