"use client";

import React, { useState } from "react";
import "../pages/styles/InformationChat.css";
import { FaBell, FaThumbtack, FaUserFriends, FaCog } from "react-icons/fa";
import GroupManagement from "./GroupManagement";

const InformationChat = ({ isGroupChat, isAdmin, user, chat, uid }) => {
    console.log("InformationChat props:", { isGroupChat, isAdmin, user, chat, uid });
    const [showGroupManagement, setShowGroupManagement] = useState(false);

    const handleGroupManagementClick = () => {
        setShowGroupManagement(true);
    };

    const handleBack = () => {
        setShowGroupManagement(false);
    };

    if (showGroupManagement) {
        return <GroupManagement onBack={handleBack} isAdmin={isAdmin} chat={chat} uid={uid} />;
    }

    const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

    return (
        <div className="info-chat-container">
            <div className="info-header">
                {/* Avatar */}
                <div className="chat-user-avatar">
                    {isGroupChat ? (
                        chat?.avataGroupChatUrl ? (
                            <img src={chat.avataGroupChatUrl} alt="Group Avatar" className="avatar-img" />
                        ) : (
                            (chat?.groupName?.charAt(0) || "G").toUpperCase()
                        )
                    ) : user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="avatar-img" />
                    ) : (
                        (user?.firstName?.charAt(0) || "U").toUpperCase()
                    )}
                </div>

                {/* Tên nhóm hoặc tên user */}
                <div className="info-name-section">
                    <span className="info-name">
                        {isGroupChat ? chat?.groupName || "Nhóm không tên" : fullName || "Tên người dùng"}
                    </span>
                    <button className="edit-button" title="Chỉnh sửa tên">
                        ✎
                    </button>
                </div>

                {/* Actions */}
                <div className="info-actions">
                    <div className="action-item">
                        <FaBell />
                        <span>Tắt thông báo</span>
                    </div>
                    <div className="action-item">
                        <FaThumbtack />
                        <span>Ghim hội thoại</span>
                    </div>
                    {!isGroupChat && (
                        <div className="action-item">
                            <FaUserFriends />
                            <span>Tạo nhóm<br />trò chuyện</span>
                        </div>
                    )}
                    {isGroupChat && (
                        <div
                            className="action-item"
                            onClick={handleGroupManagementClick}
                            title="Quản lý nhóm"
                        >
                            <FaCog />
                            <span>Quản lý<br />nhóm</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InformationChat;