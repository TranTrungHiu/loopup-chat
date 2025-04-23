import React, { useState } from "react";
import { X } from "lucide-react";
import "../pages/styles/CreateGroupModal.css";

const usersMock = [
    { id: 1, name: "Nguyễn Xuân Kỳ", avatar: "https://chatloopup.s3.amazonaws.com/avatars/avatar-1YSztG4i5XeNtUPbiA03u6pi9Jl1-1745220209228.jpeg" },
    { id: 2, name: "Trung Hiếu", avatar: "https://chatloopup.s3.amazonaws.com/avatars/avatar-1YSztG4i5XeNtUPbiA03u6pi9Jl1-1745220209228.jpeg" },
    { id: 3, name: "Nguyễn Thị Tường Vi", avatar: "https://chatloopup.s3.amazonaws.com/avatars/avatar-1YSztG4i5XeNtUPbiA03u6pi9Jl1-1745220209228.jpeg" },
    { id: 6, name: "Trường", avatar: "/avatar4.jpg" },
    { id: 7, name: "Long", avatar: "/avatar5.jpg" },
    { id: 8, name: "Hạnh", avatar: "/avatar5.jpg" },
    { id: 9, name: "Hùng", avatar: "/avatar5.jpg" }
];

const CreateGroupModal = ({ onClose }) => {
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);

    const toggleUser = (user) => {
        const exists = selectedUsers.find((u) => u.id === user.id);
        if (exists) {
            setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-70 flex items-center justify-center">
            <div className="group-modal">

                {/* Header */}
                <div className="modal-header">
                    <h2 className="text-base font-semibold">Tạo nhóm</h2>
                    <button onClick={onClose} className="close-btn small">
                        <X className="w-4 h-4" />
                    </button>
                </div>


                {/* Nhập tên nhóm */}
                <input
                    type="text"
                    placeholder="Nhập tên nhóm..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="group-name-input"
                />

                {/*Search user*/}
                <input
                    type="text"
                    placeholder="Tìm theo tên"
                    className="search-input"
                />

                {/* Main content */}
                <div className="modal-body">
                    <div className="friend-list">
                        <h3>Danh sách bạn bè</h3>
                        <div className="friend-grid">
                            {usersMock.map((user) => {
                                const isSelected = selectedUsers.find((u) => u.id === user.id);
                                return (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleUser(user)}
                                        className={`friend-card ${isSelected ? "selected" : ""}`}
                                    >
                                        <div className="avatar-wrapper">
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                sizes={30}
                                                className="friend-avatar"
                                            />
                                        </div>
                                        <span className="friend-name">{user.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {selectedUsers.length > 0 && (
                        <div className="selected-list">
                            <h3>Đã chọn {selectedUsers.length}/100</h3>
                            {selectedUsers.map((user) => (
                                <div key={user.id} className="selected-user">
                                    <div className="flex items-center">
                                        <img src={user.avatar} alt={user.name} />
                                        <span title={user.name}>
                        {user.name.length > 10 ? user.name.slice(0, 10) + "..." : user.name}
                    </span>
                                    </div>
                                    <X
                                        size={14}
                                        className="ml-2 cursor-pointer hover:text-red-300"
                                        onClick={() => toggleUser(user)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}


                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button onClick={onClose} className="cancel-btn">Hủy</button>
                    <button
                        className="create-btn"
                        disabled={selectedUsers.length < 2 || groupName.trim()=== ""}
                    >
                        Tạo nhóm
                    </button>

                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
