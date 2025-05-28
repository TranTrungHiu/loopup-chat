"use client";

import React, { useState, useEffect } from "react";
import "../pages/styles/InformationChat.css";
import { 
    FaBell, 
    FaThumbtack, 
    FaUserFriends, 
    FaCog, 
    FaTimes, 
    FaCamera,
    FaImage,
    FaInfoCircle,
    FaPhone,
    FaVideo,
    FaCircle
} from "react-icons/fa";
import GroupManagement from "./GroupManagement";
import { Button } from '@mui/material';
import axios from "axios";

const InformationChat = ({ isGroupChat, isAdmin, user, chat, uid, onClose  }) => {
    console.log("InformationChat props:", { isGroupChat, isAdmin, user, chat, uid });
    const [showGroupManagement, setShowGroupManagement] = useState(false);
    const [animate, setAnimate] = useState(true);
    const [isClosing, setIsClosing] = useState(false);

    const handleGroupManagementClick = () => {
        setShowGroupManagement(true);
    };

    const handleBack = () => {
        setShowGroupManagement(false);
    };
    
    const handleCloseInfo = (e) => {
        // Ngăn chặn sự kiện từ việc lan truyền đến phần tử cha
        if (e) {
            e.stopPropagation();
        }
        
        // Ngăn chặn xử lý khi đang trong quá trình đóng
        if (isClosing) {
            return;
        }
        
        // Đánh dấu đang trong quá trình đóng
        setIsClosing(true);
        setAnimate(false);
        
        // Đóng modal sau khi animation kết thúc
        setTimeout(() => {
            if (onClose) onClose();
            // Đặt lại trạng thái sau khi đã đóng hoàn toàn
            setTimeout(() => {
                setIsClosing(false);
            }, 100);
        }, 300); // Match this with the CSS animation duration
    };

    // Handle escape key to close
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCloseInfo();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    if (showGroupManagement) {
        return <GroupManagement onBack={handleBack} isAdmin={isAdmin} chat={chat} uid={uid} />;
    }

    //Xử lý rời nhóm
    const handleLeaveGroup = async () => {
        try {
          const confirmed = window.confirm("Bạn có chắc chắn muốn rời khỏi nhóm này?");
          if (!confirmed) return;
      
          const response = await axios.post(
            `http://localhost:8080/api/chats/${chat.chatId}/leave-group`,
            { userId: uid }
          );
      
          alert(response.data.message);
          console.log("Rời nhóm thành công:", response.data);
      
          if (onClose) onClose();
          if (onLeftGroup) onLeftGroup();
        } catch (error) {
          console.error("Lỗi khi rời nhóm:", error);
        }
      };
      
      

    const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();    // Xác định trạng thái online của người dùng
    const isUserOnline = user?.isOnline || user?.status === 'online';
    const lastActive = user?.lastActive || user?.lastSeen ? new Date(user.lastActive || user.lastSeen) : null;
    
    // Định dạng thời gian hoạt động cuối
    const formatLastActive = () => {
        if (!lastActive) return "Không xác định";
        
        const now = new Date();
        const diffMs = now - lastActive;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return "Vừa mới hoạt động";
        if (diffMins < 60) return `${diffMins} phút trước`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} giờ trước`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} ngày trước`;
    };

    return (
        <div 
            className={`info-chat-modal-container ${isClosing ? 'removing' : ''}`} 
            onClick={handleCloseInfo}
        >
            <div 
                className={`info-chat-modal-wrapper ${animate ? 'animate-in' : 'animate-out'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="info-chat-container">
                    {/* Nút đóng đẹp mắt */}
                    <button 
                        className="close-info-btn" 
                        onClick={handleCloseInfo}
                        aria-label="Đóng thông tin"
                    >
                        <FaTimes />
                    </button>

                    {/* Header với gradient */}
                    <div className="info-header-bg"></div>
                
                    <div className="info-header">
                        {/* Avatar section with improved styling */}
                        <div className="chat-user-avatar">
                            {isGroupChat ? (
                                chat?.avataGroupChatUrl ? (
                                    <img src={chat.avataGroupChatUrl} alt="Group Avatar" className="avatar-img" />
                                ) : (
                                    <div className="avatar-text">
                                        {(chat?.groupName?.charAt(0) || "G").toUpperCase()}
                                    </div>
                                )
                            ) : user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="avatar-img" />
                            ) : (
                                <div className="avatar-text">
                                    {(user?.firstName?.charAt(0) || "U").toUpperCase()}
                                </div>
                            )}
                            
                            {/* Camera icon for changing avatar */}
                            {(isGroupChat && isAdmin) || (!isGroupChat && user?.uid === uid) ? (
                                <div className="change-avatar-overlay">
                                    <FaCamera className="camera-icon" />
                                </div>
                            ) : null}
                            
                            {/* Online status indicator on avatar */}
                            {!isGroupChat && (
                                <div className={`avatar-status-indicator ${isUserOnline ? 'online' : 'offline'}`}>
                                    <FaCircle />
                                </div>
                            )}
                        </div>

                        {/* Tên nhóm hoặc tên user với khả năng chỉnh sửa */}
                        <div className="info-name-section">
                            <span className="info-name">
                                {isGroupChat ? chat?.groupName || "Nhóm không tên" : fullName || "Tên người dùng"}
                            </span>
                            {((isGroupChat && isAdmin) || (!isGroupChat && user?.uid === uid)) && (
                                <button className="edit-button" title="Chỉnh sửa tên">
                                    ✎
                                </button>
                            )}
                        </div>            
                    </div>
                    
                    {/* Communication options - 3 icons like in the image */}
                    <div className="communication-options">
                        <div className="comm-option">
                            <button className="comm-button">
                                <FaPhone />
                            </button>
                            <span>Gọi thoại</span>
                        </div>
                        <div className="comm-option">
                            <button className="comm-button">
                                <FaVideo />
                            </button>
                            <span>Gọi video</span>
                        </div>
                        <div className="comm-option">
                            <button className="comm-button info-button">
                                <FaInfoCircle />
                            </button>
                            <span>Thông tin</span>
                        </div>
                    </div>

                    <div className="separator"></div>

                    {/* Chat actions - Redesigned to match the image */}
                    <div className="chat-actions">
                        <div className="action-row">
                            <div className="action-icon">
                                <FaBell />
                            </div>
                            <div className="action-text">
                                <span>Tắt thông báo</span>
                            </div>
                        </div>
                        
                        <div className="action-row">
                            <div className="action-icon">
                                <FaThumbtack />
                            </div>
                            <div className="action-text">
                                <span>Ghim hội thoại</span>
                            </div>
                        </div>
                        
                        {!isGroupChat && (
                            <div className="action-row">
                                <div className="action-icon">
                                    <FaUserFriends />
                                </div>
                                <div className="action-text">
                                    <span>Tạo nhóm với người này</span>
                                </div>
                            </div>
                        )}
                        
                        {isGroupChat && (
                            <div className="action-row" onClick={handleGroupManagementClick}>
                                <div className="action-icon">
                                    <FaCog />
                                </div>
                                <div className="action-text">
                                    <span>Quản lý nhóm</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="separator"></div>
                    
                    {/* Shared media section */}
                    <div className="shared-media-section">
                        <h3 className="section-title">Ảnh & File đã chia sẻ</h3>
                        <div className="shared-images">
                            <div className="shared-image-placeholder">
                                <FaImage />
                            </div>
                            <div className="shared-image-placeholder">
                                <FaImage />
                            </div>
                            <div className="shared-image-placeholder">
                                <FaImage />
                            </div>
                            <div className="view-more-media">
                                <span>Xem tất cả</span>
                            </div>
                        </div>
                    </div>

                    {isGroupChat && (
                    <>
                        <div className="separator"></div>
                        <div className="leave-group-button-container">
                            <Button variant="outlined" color="error" onClick={handleLeaveGroup}>Rời nhóm</Button>
                        </div>
                    </>
                    )}

                    {/* Status display section for non-group chats */}
                    {!isGroupChat && (
                        <div className="status-display-section">
                            <div className="status-indicator">
                                <div className={`status-dot ${isUserOnline ? 'online' : 'offline'}`}></div>
                                <span className="status-text">
                                    {isUserOnline ? "Đang hoạt động" : `Hoạt động ${formatLastActive()}`}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InformationChat;