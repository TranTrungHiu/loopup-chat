"use client";

import React from "react";
import "../pages/styles/GroupManagement.css";
import { FaArrowLeft } from "react-icons/fa";

const GroupManagement = ({ onBack, isAdmin }) => {
    return (
        <div className="group-management-container">
            <div className="group-header">
                <button className="back-button" onClick={onBack}>
                    <FaArrowLeft />
                </button>
                <h3>Quản lý nhóm</h3>
            </div>

            <div className="group-section">
                <label>
                    <input type="checkbox" disabled={!isAdmin} defaultChecked />
                    Thay đổi tên & ảnh đại diện của nhóm
                </label>
                <label>
                    <input type="checkbox" disabled={!isAdmin} defaultChecked />
                    Ghim tin nhắn, ghi chú, bình chọn lên đầu hội thoại
                </label>
                <label>
                    <input type="checkbox" disabled={!isAdmin} defaultChecked />
                    Tạo mới ghi chú, nhắc hẹn
                </label>
                <label>
                    <input type="checkbox" disabled={!isAdmin} defaultChecked />
                    Tạo mới bình chọn
                </label>
                <label>
                    <input type="checkbox" disabled={!isAdmin} defaultChecked />
                    Gửi tin nhắn
                </label>
            </div>
        </div>
    );
};

export default GroupManagement;
