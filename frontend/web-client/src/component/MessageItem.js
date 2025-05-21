import React, { useState, useEffect } from "react";
import { 
  FaCheckCircle, 
  FaCheck, 
  FaExclamationCircle,
  FaDownload, 
  FaFile, 
  FaFileImage, 
  FaFilePdf, 
  FaFileWord, 
  FaFileExcel, 
  FaFilePowerpoint,
  FaFileVideo,
  FaFileAudio,
  FaFileArchive,
  FaFileCode,
  FaTimes,
  FaPlay,
  FaExpand
} from "react-icons/fa";
import "../pages/styles/MessageItem.css";

// Xử lý hiển thị icon cho các loại file khác nhau
const getFileIcon = (fileName) => {
  if (!fileName) return <FaFile />;
  
  const extension = fileName.split('.').pop().toLowerCase();
  
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) {
    return <FaFileImage />;
  } else if (['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(extension)) {
    return <FaFileVideo />;
  } else if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
    return <FaFileAudio />;
  } else if (extension === 'pdf') {
    return <FaFilePdf />;
  } else if (['doc', 'docx'].includes(extension)) {
    return <FaFileWord />;
  } else if (['xls', 'xlsx'].includes(extension)) {
    return <FaFileExcel />;
  } else if (['ppt', 'pptx'].includes(extension)) {
    return <FaFilePowerpoint />;
  } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return <FaFileArchive />;
  } else if (['js', 'html', 'css', 'java', 'py', 'c', 'cpp', 'php'].includes(extension)) {
    return <FaFileCode />;
  } else {
    return <FaFile />;
  }
};

// Modal component để hiển thị xem trước media
const MediaViewerModal = ({ media, onClose }) => {
  const [loading, setLoading] = useState(true);
  
  // Sử dụng useEffect để xử lý file không thể xem trước
  useEffect(() => {
    if (media) {
      const { url, type, fileName } = media;
      const mediaType = type || getMediaTypeFromUrl(url, fileName);
      
      // Nếu là loại file không thể xem trước, đặt loading = false ngay lập tức
      if (mediaType !== 'image' && mediaType !== 'video' && mediaType !== 'pdf' && mediaType !== 'audio') {
        setLoading(false);
      }
    }
  }, [media]);

  // Xử lý loại media khác nhau
  const renderMediaContent = () => {
    if (!media) return null;

    // Xác định loại media dựa trên URL hoặc loại được chỉ định
    const { url, type, fileName } = media;
    
    // Loại file từ phần mở rộng nếu không có type được chỉ định
    const mediaType = type || getMediaTypeFromUrl(url, fileName);
    
    // Hiển thị nội dung dựa trên loại media
    switch (mediaType) {
      case 'image':
        return (
          <img 
            src={url} 
            alt={fileName || "Hình ảnh"} 
            className="modal-media-image" 
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        );
        
      case 'video':
        return (
          <video 
            src={url} 
            className="modal-media-video" 
            controls 
            autoPlay={false}
            onLoadedData={() => setLoading(false)}
            onError={() => setLoading(false)}
          >
            Trình duyệt không hỗ trợ video.
          </video>
        );
        
      case 'pdf':
        return (
          <div className="modal-media-document">
            <iframe 
              src={`${url}#toolbar=0&navpanes=0`} 
              title={fileName || "PDF Document"}
              className="pdf-viewer"
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
            <div className="document-actions">
              <a href={url} target="_blank" rel="noopener noreferrer" className="action-button">
                <FaExpand /> Mở rộng
              </a>
              <a href={url} download={fileName} className="action-button">
                <FaDownload /> DOWNLOAD
              </a>
            </div>
          </div>
        );
        
      case 'audio':
        return (
          <div className="modal-media-audio">
            <audio 
              src={url} 
              controls 
              className="audio-player"
              onLoadedData={() => setLoading(false)}
              onError={() => setLoading(false)}
            >
              Trình duyệt không hỗ trợ audio.
            </audio>
            <div className="audio-info">
              <p>{fileName || "Tệp âm thanh"}</p>
              <a href={url} download={fileName} className="action-button">
                <FaDownload /> DOWNLOAD
              </a>
            </div>
          </div>
        );
        
      default:
        // Cho các loại file khác, hiển thị thông tin và nút tải xuống
        // Không gọi setLoading(false) ở đây, đã được xử lý trong useEffect
        return (
          <div className="modal-media-file">
            <div className="file-icon large">
              {getFileIcon(fileName || url)}
            </div>
            <div className="file-info">
              <h3>{fileName || "Tệp không xác định"}</h3>
              <p>Không thể xem trước loại tệp này.</p>
            </div>
            <div className="document-actions">
              <a href={url} download={fileName} className="action-button">
                <FaDownload /> DOWNLOAD
              </a>
            </div>
          </div>
        );
    }
  };
  
  // Hàm xác định loại media từ URL hoặc tên file
  const getMediaTypeFromUrl = (url, fileName) => {
    if (!url) return 'unknown';
    
    // Lấy phần mở rộng từ fileName hoặc url
    let extension = '';
    if (fileName && fileName.includes('.')) {
      extension = fileName.split('.').pop().toLowerCase();
    } else {
      const urlParts = url.split('?')[0].split('.');
      if (urlParts.length > 1) {
        extension = urlParts.pop().toLowerCase();
      }
    }
    
    // Xác định loại dựa trên phần mở rộng
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    } else if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension)) {
      return 'video';
    } else if (['pdf'].includes(extension)) {
      return 'pdf';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'document';
    } else if (['xls', 'xlsx'].includes(extension)) {
      return 'spreadsheet';
    } else if (['ppt', 'pptx'].includes(extension)) {
      return 'presentation';
    } else if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
      return 'audio';
    } else {
      return 'unknown';
    }
  };

  return (
    <div className="media-modal-overlay" onClick={onClose}>
      <div className="media-modal-content" onClick={e => e.stopPropagation()}>
        <button className="media-modal-close" onClick={onClose}>
          <FaTimes />
        </button>
        
        {loading && <div className="media-loading-spinner">Đang tải...</div>}
        
        <div className={`media-content-container ${loading ? 'loading' : ''}`}>
          {renderMediaContent()}
        </div>
      </div>
    </div>
  );
};

const MessageItem = ({ 
  message, 
  isCurrentUser, 
  showAvatar = true, 
  participant = null,
  formattedTime = "",
  previousSender
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [viewingMedia, setViewingMedia] = useState(null);

  useEffect(() => {
    // Debug: Log tin nhắn để hiểu cấu trúc khi gặp vấn đề
    if (!message || !message.message) {
      console.log('Debugging message structure:', message);
    }
  }, [message]);
  
  // Kiểm tra xem tin nhắn này có cần hiển thị avatar không
  const shouldShowAvatar = showAvatar && !isCurrentUser;
  
  // Kiểm tra xem tin nhắn này có cần hiển thị tên người gửi không
  const shouldShowSender = showAvatar && !isCurrentUser && participant;
  
  // Improved timestamp formatting function
  const formatTime = (timestamp) => {
    if (formattedTime) return formattedTime;
    
    // Handle different timestamp formats
    let date;
    
    if (!timestamp) {
      return '';
    }
    
    try {
      // If it's a number (unix timestamp in seconds), convert to milliseconds
      if (typeof timestamp === 'number') {
        // Check if timestamp is in seconds (10 digits) and convert to milliseconds if needed
        const isInSeconds = timestamp.toString().length === 10;
        date = new Date(isInSeconds ? timestamp * 1000 : timestamp);
      } 
      // If it's a string, try to parse it
      else if (typeof timestamp === 'string') {
        // Try parsing as ISO string
        date = new Date(timestamp);
        
        // If invalid, try parsing as Firebase timestamp
        if (isNaN(date.getTime()) && timestamp.seconds) {
          date = new Date(timestamp.seconds * 1000);
        }
      } 
      // If it's a Firebase timestamp object with seconds and nanoseconds
      else if (timestamp && timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } 
      // If it's already a Date object
      else if (timestamp instanceof Date) {
        date = timestamp;
      } 
      else {
        date = new Date();
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date format:', timestamp);
        return 'Just now';
      }
      
      return date.toLocaleString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return 'Just now';
    }
  };
  
  // Trạng thái tin nhắn
  const renderMessageStatus = () => {
    // Nếu tin nhắn đã được đọc bởi ít nhất một người khác
    if (message.readBy && Object.keys(message.readBy).length > 0) {
      // Tìm những người đã đọc không phải người gửi
      const readersNotSender = Object.keys(message.readBy).filter(
        readerId => readerId !== message.sender
      );
      
      // Nếu có người đã đọc (không phải người gửi)
      if (readersNotSender.length > 0) {
        return (
          <span className="message-status-icon seen" title="Đã xem">
            <FaCheckCircle />
          </span>
        );
      }
    }
    
    // Mặc định: đã gửi
    return (
      <span className="message-status-icon sent" title="Đã gửi">
        <FaCheck />
      </span>
    );
  };

  // Function to handle opening the media viewer
  const openMediaViewer = (mediaUrl, mediaType, fileName) => {
    setViewingMedia({
      url: mediaUrl,
      type: mediaType,
      fileName: fileName
    });
  };

  // Helper function to safely display message content
  const renderMessageContent = () => {
    // Nếu tin nhắn không tồn tại
    if (!message) {
      return 'No message data';
    }
    
    // Hỗ trợ các định dạng media
    // Ưu tiên kiểm tra trường mediaType từ backend mới
    if (message.mediaType === 'image' || message.type === 'image' || 
        (message.mediaUrl && message.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i))) {
      const mediaUrl = message.mediaUrl || message.content || message.url || message.imageUrl;
      const fileName = message.fileName || "image";
      
      return (
        <div className="message-bubble message-image-container">
          <img
            className="message-image"
            src={mediaUrl}
            alt={fileName}
            onLoad={() => setImageLoaded(true)}
            style={{ display: imageLoaded ? 'block' : 'none' }}
            onClick={() => openMediaViewer(mediaUrl, 'image', fileName)}
          />
          {!imageLoaded && <div className="image-loader">Đang tải...</div>}
          
          {/* Hiển thị thời gian bên trong bubble tin nhắn hình ảnh */}
          <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
            <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
            {isCurrentUser && renderMessageStatus()}
          </div>
        </div>
      );
    }
    
    // Trường hợp là video
    if (message.mediaType === 'video' || message.type === 'video' ||
        (message.mediaUrl && message.mediaUrl.match(/\.(mp4|webm|ogg|mov|avi)$/i))) {
      const mediaUrl = message.mediaUrl || message.content || message.url || message.videoUrl;
      const fileName = message.fileName || "video";
      
      return (
        <div className="message-bubble message-video-container">
          <div className="video-thumbnail" onClick={() => openMediaViewer(mediaUrl, 'video', fileName)}>
            {/* Video thumbnail với overlay nút play */}
            <div className="video-play-button">
              <FaPlay />
            </div>
            <div className="video-info">
              <span className="video-filename">{fileName}</span>
            </div>
          </div>
          
          {/* Hiển thị thời gian bên trong bubble tin nhắn video */}
          <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
            <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
            {isCurrentUser && renderMessageStatus()}
          </div>
        </div>
      );
    }
    
    // Trường hợp là tài liệu
    if (message.mediaType === 'document' || message.type === 'document' || message.type === 'file' ||
        (message.mediaUrl && message.fileName)) {
      const mediaUrl = message.mediaUrl || message.content || message.url || message.fileUrl;
      const fileName = message.fileName || "file";
      
      return (
        <div className="message-bubble message-document-container">
          <div 
            className="document-item" 
            onClick={() => openMediaViewer(mediaUrl, message.mediaType || 'document', fileName)}
          >
            <div className="document-icon">
              {getFileIcon(fileName)}
            </div>
            <div className="document-info">
              <div className="document-name">{fileName}</div>
              <div className="document-size">
                {message.fileSize 
                  ? formatFileSize(parseInt(message.fileSize)) 
                  : ""}
              </div>
            </div>
            <div className="document-action">
              <FaDownload />
            </div>
          </div>
          
          {/* Hiển thị thời gian bên trong bubble tin nhắn tài liệu */}
          <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
            <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
            {isCurrentUser && renderMessageStatus()}
          </div>
        </div>
      );
    }
    
    // Tin nhắn văn bản - trích xuất nội dung từ nhiều nguồn khác nhau
    let textContent = "";
    
    // Kiểm tra nội dung tin nhắn trực tiếp
    if (typeof message === 'string') {
      textContent = message;
    } else {
      // Kiểm tra tất cả các trường có thể chứa nội dung tin nhắn
      if (message.message !== undefined && message.message !== null) {
        textContent = String(message.message); // Chuyển đổi thành string trong mọi trường hợp
      } else if (message.content) {
        textContent = String(message.content);
      } else if (message.text) {
        textContent = String(message.text);
      } else if (message.data && typeof message.data === 'string') {
        textContent = message.data;
      }
    }
    
    // Nếu vẫn không có nội dung và bật chế độ debug
    if (!textContent && typeof message === 'object') {
      console.debug('Debug message structure:', Object.keys(message));
      
      // Tạo chuỗi chứa thông tin về tất cả các trường trong đối tượng tin nhắn
      const messageFields = Object.entries(message)
        .filter(([key]) => key !== 'readBy') // Loại bỏ trường readBy phức tạp
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return `${key}: [Object]`;
          }
          return `${key}: ${value}`;
        })
        .join(', ');
      
      if (debugMode) {
        return (
          <div className="message-bubble debug-message">
            <div className="message-text">
              <strong>Debug:</strong> {messageFields}
              <button 
                className="debug-button" 
                onClick={() => setDebugMode(false)}
              >
                Ẩn Debug
              </button>
            </div>
            
            {/* Hiển thị thời gian trong debug message */}
            <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
              <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
              {isCurrentUser && renderMessageStatus()}
            </div>
          </div>
        );
      } else {
        return (
          <div className="message-bubble">
            <div className="message-text">
              Không thể hiển thị nội dung tin nhắn
              <button 
                className="debug-button" 
                onClick={() => setDebugMode(true)}
              >
                Hiển thị Debug
              </button>
            </div>
            
            {/* Hiển thị thời gian trong message không có nội dung */}
            <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
              <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
              {isCurrentUser && renderMessageStatus()}
            </div>
          </div>
        );
      }
    }
    
    return (
      <div className="message-bubble">
        <div className="message-text">{textContent}</div>
        
        {/* Hiển thị thời gian bên trong bubble tin nhắn văn bản */}
        <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
          <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
          {isCurrentUser && renderMessageStatus()}
        </div>
      </div>
    );
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return "";
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Get appropriate avatar for the participant
  const getAvatar = () => {
    if (!participant) return null;
    
    if (participant.avatarUrl) {
      return (
        <div 
          className="message-avatar" 
          style={{ backgroundImage: `url(${participant.avatarUrl})` }}
        />
      );
    }
    
    // Use initial letter if no avatar
    const initial = participant.firstName?.charAt(0) || 
                    participant.lastName?.charAt(0) || 
                    '?';
                    
    const avatarColor = participant.avatarColor || 
                       `hsl(${(initial.charCodeAt(0) * 10 % 360)}, 70%, 50%)`;
                        
    return (
      <div 
        className="message-avatar" 
        style={{ backgroundColor: avatarColor }}
      >
        {initial.toUpperCase()}
      </div>
    );
  };

  return (
    <>
      <div className={`message-item ${isCurrentUser ? 'user' : 'other'}`}>
        {/* Avatar của người gửi */}
        {shouldShowAvatar && (
          <div className="message-avatar-container">
            {getAvatar()}
          </div>
        )}

        {/* Container nội dung tin nhắn */}
        <div className={`message-container ${!shouldShowAvatar && !isCurrentUser ? 'no-avatar' : ''}`}>
          {/* Tên người gửi */}
          {shouldShowSender && participant && (
            <div className="message-sender">
              {participant.firstName} {participant.lastName}
            </div>
          )}

          {/* Nội dung tin nhắn */}
          {renderMessageContent()}
        </div>
      </div>
      
      {/* Modal xem trước media */}
      {viewingMedia && (
        <MediaViewerModal 
          media={viewingMedia} 
          onClose={() => setViewingMedia(null)}
        />
      )}
    </>
  );
};

export default MessageItem;