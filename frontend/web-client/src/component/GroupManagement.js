import React, { useEffect, useState } from "react";
import "../pages/styles/GroupManagement.css";
import { FaArrowLeft, FaTrash, FaCrown, FaUserPlus, FaUsers, FaPlus, FaTimes } from "react-icons/fa";

const GroupManagement = ({ chat, onBack, isAdmin, uid }) => {
    const [members, setMembers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [nonMembers, setNonMembers] = useState([]);
    const [activeSection, setActiveSection] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null); // userId đang chờ xác nhận xoá
    const token = localStorage.getItem("idToken");
    const chatId = chat?.chatId;

    const fetchGroupMembers = async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/chats/${chatId}/members`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                throw new Error("Không thể lấy danh sách thành viên");
            }
            const data = await res.json();
            setMembers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Lỗi khi lấy thành viên nhóm:", err);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/user", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                throw new Error("Không thể lấy danh sách người dùng");
            }
            const data = await res.json();
            setAllUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Lỗi khi lấy danh sách người dùng:", err);
        }
    };

    useEffect(() => {
        if (chatId) {
            fetchGroupMembers();
            fetchAllUsers();
        }
    }, [chatId]);

    useEffect(() => {
        const memberIds = members.map((m) => m.uid);
        const notInGroup = allUsers.filter((user) => !memberIds.includes(user.uid));
        setNonMembers(notInGroup);
    }, [members, allUsers]);

    const handleAddMember = async (userId) => {
        try {
            const res = await fetch(`http://localhost:8080/api/chats/${chatId}/add-member`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId }),
            });
            if (!res.ok) {
                throw new Error("Không thể thêm thành viên");
            }
            await fetchGroupMembers();
        } catch (err) {
            console.error("Lỗi khi thêm thành viên:", err);
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            const res = await fetch(`http://localhost:8080/api/chats/${chatId}/remove-member`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId }),
            });
            if (!res.ok) {
                throw new Error("Không thể xóa thành viên");
            }
            setConfirmDelete(null);
            await fetchGroupMembers();
        } catch (err) {
            console.error("Lỗi khi xóa thành viên:", err);
        }
    };

    const handleTransferAdmin = async (userId) => {
        try {
            const res = await fetch(`http://localhost:8080/api/chats/${chatId}/transfer-admin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId }),
            });
            if (!res.ok) {
                throw new Error("Không thể nhượng quyền admin");
            }
            alert("Đã nhượng quyền admin!");
            await fetchGroupMembers();
            onBack();
        } catch (err) {
            console.error("Lỗi khi nhượng quyền admin:", err);
        }
    };

    const handleDeleteGroup = async () => {
        const confirmed = window.confirm("Bạn có chắc chắn muốn giải tán nhóm?");
        if (!confirmed) return;

        try {
            const res = await fetch(`http://localhost:8080/api/chats/${chatId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                throw new Error("Không thể giải tán nhóm");
            }
            alert("Nhóm đã được giải tán.");
            onBack();
        } catch (err) {
            console.error("Lỗi khi giải tán nhóm:", err);
        }
    };

    return (
        <div className="group-management-container">
            <div className="group-header">
                <button className="back-button" onClick={onBack}>
                    <FaArrowLeft />
                </button>
                <h2>Quản lý nhóm</h2>
            </div>

            <div className="menu-tabs">
                <button onClick={() => setActiveSection("view")} className={activeSection === "view" ? "active" : ""}>
                    <FaUsers /> Xem thành viên
                </button>
                {isAdmin && (
                    <>
                        <button onClick={() => setActiveSection("add")} className={activeSection === "add" ? "active" : ""}>
                            <FaPlus /> Thêm thành viên
                        </button>
                        <button onClick={() => setActiveSection("remove")} className={activeSection === "remove" ? "active" : ""}>
                            <FaTrash /> Xoá thành viên
                        </button>
                        <button onClick={handleDeleteGroup} className="danger-button">
                            ❌ Giải tán nhóm
                        </button>
                    </>
                )}
            </div>

            {activeSection === "view" && (
                <div className="group-section">
                    <h3>👥 Danh sách thành viên</h3>
                    <ul className="user-list">
                        {members.map((member) => (
                            <li key={member.uid} className="user-item">
                                <span>{member.firstName} {member.lastName}</span>
                                {isAdmin && member.uid !== uid && (
                                    <button
                                        className="icon-button"
                                        title="Nhượng quyền admin"
                                        onClick={() => handleTransferAdmin(member.uid)}
                                    >
                                        <FaCrown />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {activeSection === "add" && (
                <div className="group-section">
                    <h3>➕ Thêm thành viên</h3>
                    <ul className="user-list">
                        {nonMembers.length > 0 ? (
                            nonMembers.map((user) => (
                                <li key={user.uid} className="user-item">
                                    <span>{user.firstName} {user.lastName}</span>
                                    <button
                                        title="Thêm vào nhóm"
                                        onClick={() => handleAddMember(user.uid)}
                                        className="icon-button"
                                    >
                                        <FaUserPlus />
                                    </button>
                                </li>
                            ))
                        ) : (
                            <li>Không còn ai để thêm.</li>
                        )}
                    </ul>
                </div>
            )}

            {activeSection === "remove" && (
                <div className="group-section">
                    <h3>➖ Xoá thành viên</h3>
                    <ul className="user-list">
                        {members
                            .filter((m) => m.uid !== uid)
                            .map((member) => (
                                <li key={member.uid} className="user-item">
                                    <span>{member.firstName} {member.lastName}</span>
                                    {confirmDelete === member.uid ? (
                                        <span className="confirm-buttons">
                                            <button
                                                className="icon-button danger"
                                                onClick={() => handleRemoveMember(member.uid)}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                className="icon-button"
                                                onClick={() => setConfirmDelete(null)}
                                            >
                                                No
                                            </button>
                                        </span>
                                    ) : (
                                        <button
                                            title="Xoá thành viên"
                                            onClick={() => setConfirmDelete(member.uid)}
                                            className="danger-button"
                                        >
                                            <FaTrash />
                                        </button>
                                    )}
                                </li>
                            ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default GroupManagement;