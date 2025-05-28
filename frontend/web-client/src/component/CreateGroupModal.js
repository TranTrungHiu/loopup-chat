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
    const [validationError, setValidationError] = useState("");
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
        // Clear previous errors
        setValidationError("");

        // Validation
        if (groupName.trim() === "") {
            setValidationError("Vui lòng nhập tên nhóm");
            return;
        }
        if (groupName.trim().length < 2) {
            setValidationError("Tên nhóm phải có ít nhất 2 ký tự");
            return;
        }
        if (selectedUsers.length < 2) {
            setValidationError("Vui lòng chọn ít nhất 2 thành viên");
            return;
        }

        setIsCreating(true);
        setValidationError(""); // Reset validation error

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

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                if (selectedUsers.length >= 2 && groupName.trim() !== "" && !isCreating) {
                    handleCreateGroup();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose, selectedUsers, groupName, isCreating]);

    // Clear validation error when user types
    useEffect(() => {
        if (validationError && (groupName.trim() || selectedUsers.length > 0)) {
            setValidationError("");
        }
    }, [groupName, selectedUsers, validationError]);    return (
        <div className="fixed inset-0 bg-black/60 z-70 flex items-center justify-center p-4" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflow: 'auto'
        }}>
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
                    placeholder="Nhập tên nhóm... (Ctrl+Enter để tạo)"
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
                />                {/* Nội dung */}
                <div className="modal-body">
                    {/* Danh sách bạn bè */}
                    <div className="friend-list">
                        <h3>
                            Danh sách bạn bè
                            <span className="friend-count-badge">{filteredFriends.length}</span>
                        </h3>
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

                            {/* Empty State cho danh sách bạn bè */}
                            {filteredFriends.length === 0 && (
                                <div className="empty-state">
                                    <FaUsers className="empty-icon" />
                                    <p>Không tìm thấy bạn bè nào</p>
                                    <span>Hãy thử tìm kiếm với từ khóa khác</span>
                                </div>
                            )}
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
                                        size={16}
                                        className="remove-user-btn"
                                        onClick={() => toggleUser(user)}
                                    />
                                </div>
                            ))}

                            {/* Empty State cho danh sách đã chọn */}
                            {selectedUsers.length === 0 && (
                                <div className="empty-state">
                                    <div className="empty-icon">👥</div>
                                    <p>Chưa chọn thành viên nào</p>
                                    <span>Chọn ít nhất 2 người để tạo nhóm</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Thông báo lỗi validation */}
                    {validationError && (
                        <div className="validation-error">
                            {validationError}
                        </div>
                    )}

                    {/* Validation Error Message */}
                    {validationError && (
                        <div className="validation-message">
                            {validationError}
                        </div>
                    )}
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

                {/* Loading Overlay */}
                {isCreating && (
                    <div className="modal-loading-overlay">
                        <div className="loading-content">
                            <FaSpinner className="spinner" />
                            <p>Đang tạo nhóm chat...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateGroupModal;
