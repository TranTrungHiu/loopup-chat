"use client";

import React, { useState } from "react";
import "../pages/styles/InformationChat.css";
import { FaBell, FaThumbtack, FaUserFriends, FaCog } from "react-icons/fa";
import GroupManagement from "./GroupManagement";

const InformationChat = ({ isGroupChat, isAdmin }) => {
    const [showGroupManagement, setShowGroupManagement] = useState(false);

    const handleGroupManagementClick = () => {
        if (true) { //Nhớ đổi thành isAdmin
            setShowGroupManagement(true);
        }
    };

    const handleBack = () => {
        setShowGroupManagement(false);
    };

    if (showGroupManagement) {
        return <GroupManagement onBack={handleBack} isAdmin={true} />; //Nhớ đổi thành isAdmin
    }

    return (
        <div className="info-chat-container">
            <div className="info-header">

                {/*//Image*/}
                <div className="avatar-circle">TT</div>


                {/*SHOW NAME*/}
                <div className="info-name-section">
                    <span className="info-name">Tran Minh Thong</span>
                    <button className="edit-button" title="Chỉnh sửa tên">✎</button>
                </div>

                {/*Function*/}
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

                    {!isGroupChat && ( //Nhớ bỏ dấu ! đi
                        <div
                            className={`action-item ${!isAdmin ? "" : ""}`} //test thành công thì đổi cái "" đầu tiên thành disable
                            onClick={handleGroupManagementClick}
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
