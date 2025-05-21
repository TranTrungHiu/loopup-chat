import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import "../pages/styles/CreateGroupModal.css";
import { socket } from "../services/socketService";
import { FaUsers, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";

const CreateGroupModal = ({ onClose, userId }) => {
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [friendList, setFriendList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const token = localStorage.getItem("idToken");

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/friends/list/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });
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
    }, [userId, token]);

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

    const handleCreateGroup = async () => {
        if (selectedUsers.length < 2 || groupName.trim() === "") {
            return;
        }

        setIsCreating(true);

        try {
            // Chuẩn bị danh sách thành viên (bao gồm cả người tạo nhóm)
            const memberIds = [...selectedUsers.map(user => user.id)];
            if (!memberIds.includes(userId)) {
                memberIds.push(userId);
            }

            const response = await fetch("http://localhost:8080/api/chats", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    adminId: userId,
                    groupName: groupName,
                    memberIds: memberIds,
                    isGroupChat: true,
                }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                // Gửi thông báo qua socket để cập nhật danh sách chat cho tất cả thành viên
                if (socket && socket.connected) {
                    console.log("Emit socket event: group_created");
                    socket.emit('group_created', {
                        chat: data,
                        memberIds: memberIds
                    });
                }

                toast.success("Nhóm đã được tạo thành công!", {
                    position: "top-right",
                    autoClose: 3000,
                });
                onClose();
            } else {
                toast.error("Lỗi khi tạo nhóm: " + (data.message || "Không rõ nguyên nhân"), {
                    position: "top-right",
                    autoClose: 5000,
                });
            }
        } catch (error) {
            console.error("Lỗi khi gọi API tạo nhóm:", error);
            toast.error("Có lỗi xảy ra khi tạo nhóm!", {
                position: "top-right",
                autoClose: 5000,
            });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-70 flex items-center justify-center">
            <div className="group-modal">
                {/* Header */}
                <div className="modal-header">
                    <h2 className="h2">
                        <FaUsers className="group-icon" /> Tạo nhóm chat
                    </h2>
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
                                                onError={(e) => {e.target.src = "/default-avatar.jpg"}}
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
                                        <img 
                                            src={user.avatar} 
                                            alt={user.fullName}
                                            onError={(e) => {e.target.src = "/default-avatar.jpg"}}
                                        />
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
                        disabled={selectedUsers.length < 2 || groupName.trim() === "" || isCreating}
                        onClick={handleCreateGroup}
                    >
                        {isCreating ? (
                            <>
                                <FaSpinner className="spinner" /> Đang tạo...
                            </>
                        ) : (
                            'Tạo nhóm'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
