import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import "../pages/styles/CreateGroupModal.css";
const CreateGroupModal = ({ onClose, userId }) => {
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [friendList, setFriendList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/friends/list/${userId}`);
                const data = await response.json();
                setFriendList(Array.isArray(data) ? data : data.data || []);
            } catch (error) {
                console.error("Lỗi khi gọi API:", error);
                setFriendList([]);
            }
        };

        if (userId) {
            fetchFriends();
        }
    }, [userId]);

    const sanitizedFriendList = friendList.map(user => ({
        ...user,
        fullName: `${user.lastName} ${user.firstName}`.trim(),
        avatar: user.avatarUrl || "/default-avatar.jpg"
    }));

    const filteredFriends = sanitizedFriendList.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h2 className="h2">Tạo nhóm</h2>
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

                {/* Tìm kiếm bạn */}
                <input
                    type="text"
                    placeholder="Tìm theo tên"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />

                {/* Nội dung */}
                <div className="modal-body">
                    {/* Danh sách bạn bè */}
                    <div className="friend-list">
                        <h3>Trò chuyện gần đây</h3>
                        <div className="friend-grid">
                            {filteredFriends.map((user) => {
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
                                                alt={user.fullName}
                                                className="friend-avatar"
                                            />
                                        </div>
                                        <span className="friend-name">{user.fullName}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Danh sách đã chọn */}
                    <div className="selected-list">
                        <h3>Đã chọn <span>{selectedUsers.length}/100</span></h3>
                        <div className="selected-scroll">
                            {selectedUsers.map((user) => (
                                <div key={user.id} className="selected-user">
                                    <div className="flex items-center gap-2">
                                        <img src={user.avatar} alt={user.fullName} />
                                        <span title={user.fullName}>
                                            {user.fullName.length > 14 ? user.fullName.slice(0, 14) + "..." : user.fullName}
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
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button onClick={onClose} className="cancel-btn">Hủy</button>
                    <button
                        className="create-btn"
                        disabled={selectedUsers.length < 2 || groupName.trim() === ""}
                        onClick={async () => {
                            try {
                                const response = await fetch("http://localhost:8080/api/chats", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        adminId: userId,
                                        groupName: groupName,
                                        memberIds: selectedUsers.map(user => user.id),
                                        isGroupChat: true,
                                    }),
                                });
                        
                                const data = await response.json();
                        
                                if (response.ok) {
                                    alert("Nhóm đã được tạo thành công!");
                                    onClose();
                                } else {
                                    alert("❌ Lỗi khi tạo nhóm: " + (data.message || "Không rõ nguyên nhân"));
                                }
                            } catch (error) {
                                console.error("Lỗi khi gọi API tạo nhóm:", error);
                                alert("❌ Có lỗi xảy ra khi tạo nhóm!");
                            }
                        }}
                        
                    >
                        Tạo nhóm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
