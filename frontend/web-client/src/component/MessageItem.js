import React, { useState, useEffect, forwardRef } from "react";
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
  FaExpand,
  FaReply, FaShare, FaEllipsisV, FaCopy, FaUndo, FaEdit
} from "react-icons/fa";
import "../pages/styles/MessageItem.css";

// Xử lý hiển thị icon cho các loại file khác nhau
const getFileIcon = (fileName) => {
  if (!fileName) return <FaFile />;
  const extension = fileName.split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) return <FaFileImage />;
  if (['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(extension)) return <FaFileVideo />;
  if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) return <FaFileAudio />;
  if (extension === 'pdf') return <FaFilePdf />;
  if (['doc', 'docx'].includes(extension)) return <FaFileWord />;
  if (['xls', 'xlsx'].includes(extension)) return <FaFileExcel />;
  if (['ppt', 'pptx'].includes(extension)) return <FaFilePowerpoint />;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return <FaFileArchive />;
  if (['js', 'html', 'css', 'java', 'py', 'c', 'cpp', 'php'].includes(extension)) return <FaFileCode />;
  return <FaFile />;
};

// Modal component để hiển thị xem trước media
const MediaViewerModal = ({ media, onClose }) => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (media) {
      const { url, type, fileName } = media;
      const mediaType = type || getMediaTypeFromUrl(url, fileName);
      if (mediaType !== 'image' && mediaType !== 'video' && mediaType !== 'pdf' && mediaType !== 'audio') {
        setLoading(false);
      }
    }
  }, [media]);
  const renderMediaContent = () => {
    if (!media) return null;
    const { url, type, fileName } = media;
    const mediaType = type || getMediaTypeFromUrl(url, fileName);
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
  const getMediaTypeFromUrl = (url, fileName) => {
    if (!url) return 'unknown';
    let extension = '';
    if (fileName && fileName.includes('.')) {
      extension = fileName.split('.').pop().toLowerCase();
    } else {
      const urlParts = url.split('?')[0].split('.');
      if (urlParts.length > 1) {
        extension = urlParts.pop().toLowerCase();
      }
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension)) return 'video';
    if (['pdf'].includes(extension)) return 'pdf';
    if (['doc', 'docx'].includes(extension)) return 'document';
    if (['xls', 'xlsx'].includes(extension)) return 'spreadsheet';
    if (['ppt', 'pptx'].includes(extension)) return 'presentation';
    if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) return 'audio';
    return 'unknown';
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

// Sử dụng forwardRef để hỗ trợ scroll-to-reply
const MessageItem = forwardRef(({
  message, 
  isCurrentUser, 
  showAvatar = true, 
  participant = null,
  formattedTime = "",
  previousSender,
  friendsList = [],
  uid,
  onReply,
  onForward, // <-- prop để mở modal chuyển tiếp ở Home.jsx
  onForwardSuccess,
  getReplyContent,
  getReplyAuthorName,
  onStartEdit
}, ref) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [viewingMedia, setViewingMedia] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Hover actions
  const handleReply = () => {
    if (typeof onReply === "function") onReply(message);
  };
  // Gọi prop onForward để Home.jsx mở modal chuyển tiếp
  const handleForward = () => {
  // Đảm bảo truyền mảng!
  if (typeof onForward === "function") {
    onForward([message]);
  }
};
  const handleCopy = () => {
    if (typeof message.message === "string" && message.message.trim()) {
      navigator.clipboard.writeText(message.message);
    }
  };
  const handleRecall = async () => {
    await fetch(`http://localhost:8080/api/messages/${message.id}/recall`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("idToken")}`,
      },
      body: JSON.stringify({ userId: uid || message.sender }),
    });
    setShowMore(false);
  };
  const handleDownload = (url, fileName) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "file";
    a.click();
  };

  // Kiểm tra xem tin nhắn này có cần hiển thị avatar không
  const shouldShowAvatar = showAvatar && !isCurrentUser;
  // Kiểm tra xem tin nhắn này có cần hiển thị tên người gửi không
  const shouldShowSender = showAvatar && !isCurrentUser && participant;

  // Improved timestamp formatting function
  const formatTime = (timestamp) => {
    if (formattedTime) return formattedTime;
    let date;
    if (!timestamp) return '';
    try {
      if (typeof timestamp === 'number') {
        const isInSeconds = timestamp.toString().length === 10;
        date = new Date(isInSeconds ? timestamp * 1000 : timestamp);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
        if (isNaN(date.getTime()) && timestamp.seconds) {
          date = new Date(timestamp.seconds * 1000);
        }
      } else if (timestamp && timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date();
      }
      if (isNaN(date.getTime())) {
        return 'Just now';
      }
      return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Just now';
    }
  };

  const renderMessageStatus = () => {
    if (message.readBy && Object.keys(message.readBy).length > 0) {
      const readersNotSender = Object.keys(message.readBy).filter(
        readerId => readerId !== message.sender
      );
      if (readersNotSender.length > 0) {
        return (
          <span className="message-status-icon seen" title="Đã xem">
            <FaCheckCircle />
          </span>
        );
      }
    }
    return (
      <span className="message-status-icon sent" title="Đã gửi">
        <FaCheck />
      </span>
    );
  };

  const openMediaViewer = (mediaUrl, mediaType, fileName) => {
    setViewingMedia({
      url: mediaUrl,
      type: mediaType,
      fileName: fileName
    });
  };

  const renderMessageContent = () => {
    if (!message) return 'No message data';
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
          <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
            <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
            {isCurrentUser && renderMessageStatus()}
          </div>
        </div>
      );
    }
    if (message.mediaType === 'video' || message.type === 'video' ||
        (message.mediaUrl && message.mediaUrl.match(/\.(mp4|webm|ogg|mov|avi)$/i))) {
      const mediaUrl = message.mediaUrl || message.content || message.url || message.videoUrl;
      const fileName = message.fileName || "video";
      return (
        <div className="message-bubble message-video-container">
          <div className="video-thumbnail" onClick={() => openMediaViewer(mediaUrl, 'video', fileName)}>
            <div className="video-play-button">
              <FaPlay />
            </div>
            <div className="video-info">
              <span className="video-filename">{fileName}</span>
            </div>
          </div>
          <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
            <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
            {isCurrentUser && renderMessageStatus()}
          </div>
        </div>
      );
    }
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
          <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
            <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
            {isCurrentUser && renderMessageStatus()}
          </div>
        </div>
      );
    }
    let textContent = "";
    if (typeof message === 'string') {
      textContent = message;
    } else {
      if (message.message !== undefined && message.message !== null) {
        textContent = String(message.message);
      } else if (message.content) {
        textContent = String(message.content);
      } else if (message.text) {
        textContent = String(message.text);
      } else if (message.data && typeof message.data === 'string') {
        textContent = message.data;
      }
    }
    if (!textContent && typeof message === 'object') {
      const messageFields = Object.entries(message)
        .filter(([key]) => key !== 'readBy')
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
        <div className="message-text">
          {textContent}
          {message.edited && (
            <span className="edited-label" style={{ color: "#888", marginLeft: 8 }}>
              (đã chỉnh sửa)
            </span>
          )}
        </div>
        <div className={`message-time-container-inside ${isCurrentUser ? 'user' : 'other'}`}>
          <span className="message-time">{formatTime(message.timestamp || message.createdAt || message.date)}</span>
          {isCurrentUser && renderMessageStatus()}
        </div>
      </div>
    );
  };

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

  // Nếu đã thu hồi thì không hover nữa
  const isRecalled = message.type === "recalled" || message.message === "Tin nhắn đã được thu hồi";

  return (
    <>
      <div 
        ref={ref}
        className={`message-item ${isCurrentUser ? 'user' : 'other'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setShowMore(false); }}
        style={{ position: "relative" }}
      >
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
          {isRecalled ? (
            <div className="message-bubble recalled">
              <span style={{ color: "#888" }}>Tin nhắn đã được thu hồi</span>
            </div>
          ) : (
            <>
              {/* Hiển thị phần trả lời nếu có */}
              {message.replyTo && getReplyContent && (
                <div className="reply-preview">
                  <span className="reply-author">
                    {getReplyAuthorName && getReplyAuthorName(message.replyTo)}
                  </span>
                  <span className="reply-content">
                    {getReplyContent && getReplyContent(message.replyTo)}
                  </span>
                </div>
              )}
              {renderMessageContent()}
              {/* Nút chức năng khi hover */}
              {hovered && (
                <div className="message-actions" style={{
                  position: "absolute",
                  top: 8,
                  right: isCurrentUser ? "calc(100% + 8px)" : undefined,
                  left: !isCurrentUser ? "calc(100% + 8px)" : undefined,
                  display: "flex",
                  gap: 8,
                  zIndex: 10
                }}>
                  <button className="action-btn" title="Trả lời" onClick={handleReply}><FaReply /></button>
                  <button className="action-btn" title="Chuyển tiếp" onClick={handleForward}><FaShare /></button>
                  <div style={{ position: "relative" }}>
                    <button className="action-btn" title="Thêm" onClick={() => setShowMore(v => !v)}><FaEllipsisV /></button>
                    {showMore && (
                      <div className="more-actions-popup" style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        background: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: 6,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        zIndex: 100,
                        minWidth: 120
                      }}>
                        {(!message.mediaUrl || message.mediaType === "text") && (
                          <button className="more-action-btn" onClick={handleCopy}><FaCopy /> Copy</button>
                        )}
                        {(message.mediaUrl && message.mediaType !== "text") && (
                          <button className="more-action-btn" onClick={() => handleDownload(message.mediaUrl, message.fileName)}><FaDownload /> Tải về máy</button>
                        )}
                        {isCurrentUser && (
                          <button className="more-action-btn btn-danger" onClick={handleRecall}><FaUndo /> Thu hồi</button>
                        )}
                        {isCurrentUser && typeof message.message === "string" && (
                          <button
                            className="more-action-btn"
                            onClick={() => {
                              if (typeof onStartEdit === "function") onStartEdit(message);
                            }}
                          >
                            <FaEdit /> Sửa
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
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
});

export default MessageItem;