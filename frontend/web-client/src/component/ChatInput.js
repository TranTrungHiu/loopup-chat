import React, { useState, useRef } from "react";
import { 
  FaPaperPlane, 
  FaSmile, 
  FaPaperclip, 
  FaImage, 
  FaMicrophone,
  FaVideo,
  FaFileAlt,
  FaTimes
} from "react-icons/fa";
import "../pages/styles/ChatInput.css";

const ChatInput = ({ onSendMessage, onSendFile, onSendImage, isTyping, setIsTyping, chatId, currentUserId }) => {
  const [message, setMessage] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);
  
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

  // Hàm chung để xử lý tất cả các loại media
  const handleMediaUpload = async (file, mediaType) => {
    if (!file) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Lấy thông tin về file
      const fileExtension = file.name.split('.').pop();
      const fileName = file.name;
      const contentType = file.type;
      const fileSize = file.size;
      
      // 1. Gọi API để lấy URL presigned để upload
      const generateUrlResponse = await fetch('/api/messages/generate-upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          contentType,
          fileExtension,
          mediaType
        }),
      });
      
      if (!generateUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { uploadUrl, downloadUrl, objectKey } = await generateUrlResponse.json();
      
      // 2. Upload file trực tiếp lên S3 sử dụng presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: file,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }
      
      // 3. Gửi tin nhắn với link media
      const mediaMessage = {
        chatId: chatId,
        sender: currentUserId,
        mediaUrl: downloadUrl,
        mediaType: mediaType,
        fileName: fileName,
        fileSize: fileSize.toString()
      };
      
      const sendResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mediaMessage),
      });
      
      if (!sendResponse.ok) {
        throw new Error('Failed to send message');
      }
      
      // Đóng menu đính kèm
      setShowAttachMenu(false);
      
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Lỗi khi tải lên: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Xử lý đính kèm file chung 
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Xác định loại media dựa trên loại file
    let mediaType = 'document';
    const fileType = file.type.split('/')[0];
    
    if (fileType === 'image') {
      mediaType = 'image';
    } else if (fileType === 'video') {
      mediaType = 'video';
    } else if (fileType === 'audio') {
      mediaType = 'audio';
    }
    
    handleMediaUpload(file, mediaType);
    
    // Reset input để có thể chọn cùng một file nhiều lần
    e.target.value = null;
  };
  
  // Xử lý đính kèm hình ảnh
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleMediaUpload(file, 'image');
    }
    // Reset input
    e.target.value = null;
  };
  
  // Xử lý đính kèm video
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleMediaUpload(file, 'video');
    }
    // Reset input
    e.target.value = null;
  };
  
  // Xử lý đính kèm tài liệu
  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleMediaUpload(file, 'document');
    }
    // Reset input
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
            disabled={uploading}
          >
            <FaImage />
          </button>
          <button 
            className="attach-btn video-btn" 
            onClick={() => videoInputRef.current.click()}
            title="Gửi video"
            disabled={uploading}
          >
            <FaVideo />
          </button>
          <button 
            className="attach-btn document-btn" 
            onClick={() => documentInputRef.current.click()}
            title="Gửi tài liệu"
            disabled={uploading}
          >
            <FaFileAlt />
          </button>
          <button 
            className="attach-btn close-btn" 
            onClick={() => setShowAttachMenu(false)}
            title="Đóng"
          >
            <FaTimes />
          </button>
        </div>
      )}
      
      {/* Trạng thái đang upload */}
      {uploading && (
        <div className="upload-progress-container">
          <div 
            className="upload-progress-bar" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
          <span className="upload-progress-text">
            Đang tải lên... {uploadProgress}%
          </span>
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
      
      {/* Input ẩn để chọn video */}
      <input
        type="file"
        ref={videoInputRef}
        style={{ display: "none" }}
        accept="video/*"
        onChange={handleVideoChange}
      />
      
      {/* Input ẩn để chọn tài liệu */}
      <input
        type="file"
        ref={documentInputRef}
        style={{ display: "none" }}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        onChange={handleDocumentChange}
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
          disabled={uploading}
        />
        
        <button 
          className="attach-toggle-btn" 
          type="button"
          onClick={() => setShowAttachMenu(!showAttachMenu)}
          disabled={uploading}
        >
          <FaPaperclip />
        </button>
        
        {message.trim() ? (
          <button 
            className="send-btn" 
            type="button"
            onClick={handleSend}
            disabled={uploading}
          >
            <FaPaperPlane />
          </button>
        ) : (
          <button 
            className="voice-btn" 
            type="button"
            disabled={uploading}
          >
            <FaMicrophone />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;