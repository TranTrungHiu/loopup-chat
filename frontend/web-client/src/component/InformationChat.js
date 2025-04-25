"use client";

import React, { useState } from "react";
import "../pages/styles/InformationChat.css";
import { FaBell, FaThumbtack, FaUserFriends, FaCog } from "react-icons/fa";
import GroupManagement from "./GroupManagement";

const InformationChat = ({ isGroupChat, isAdmin, user }) => {
    //log avataUrl
    console.log("Avatar URL:", user?.avatarUrl);
    const [showGroupManagement, setShowGroupManagement] = useState(false);

    const handleGroupManagementClick = () => {
        if (isAdmin) {
            setShowGroupManagement(true);
        }
    };

    const handleBack = () => {
        setShowGroupManagement(false);
    };

    if (showGroupManagement) {
        return <GroupManagement onBack={handleBack} isAdmin={isAdmin} />;
    }

    const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

    return (
        <div className="info-chat-container">
            <div className="info-header">
                {/* Avatar */}
                <div className="chat-user-avatar">
                    {user?.avatarUrl ? (
                        <img src={user?.avatarUrl} alt="Avatar" className="avatar-img" />
                    ) : (
                        (user?.firstName?.charAt(0) || "U").toUpperCase()
                    )}
                </div>

                {/* User name */}
                <div className="info-name-section">
                    <span className="info-name">{fullName || "Tên người dùng"}</span>
                    <button className="edit-button" title="Chỉnh sửa tên">✎</button>
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
                    <div className="action-item">
                        <FaUserFriends />
                        <span>Tạo nhóm<br />trò chuyện</span>
                    </div>

                    {isGroupChat && (
                        <div
                            className={`action-item ${!isAdmin ? "disabled" : ""}`}
                            onClick={isAdmin ? handleGroupManagementClick : undefined}
                            title={isAdmin ? "Quản lý nhóm" : "Chỉ admin mới được truy cập"}
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
