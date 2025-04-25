import React, { useState } from "react";
import "../pages/styles/GroupManagement.css";
import { FaUsers, FaUserPlus, FaUserMinus, FaCrown, FaTrash } from "react-icons/fa";
import Modal from "react-modal";

Modal.setAppElement("#root");

const GroupManagement = ({ groupChat, groupDetails, isAdmin }) => {
  const [showMembers, setShowMembers] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isRemoveMemberModalOpen, setIsRemoveMemberModalOpen] = useState(false);
  const [isTransferAdminModalOpen, setIsTransferAdminModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [showNotFound, setShowNotFound] = useState(false);
  const token = localStorage.getItem("idToken");
  const uid = localStorage.getItem("uid");

  const handleSearchUser = async () => {
    if (!newMemberEmail) return;
    try {
      const res = await fetch(
        `http://localhost:8080/api/user/find?email=${newMemberEmail}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        setFoundUser(null);
        setShowNotFound(true);
        setTimeout(() => setShowNotFound(false), 3000);
        return;
      }

      const user = await res.json();
      setFoundUser(user);
    } catch (err) {
      console.error("Error finding user:", err);
      setFoundUser(null);
      setShowNotFound(true);
      setTimeout(() => setShowNotFound(false), 3000);
    }
  };

  const handleAddMember = async () => {
    if (!foundUser) return;
    try {
      const response = await fetch(
        `http://localhost:8080/api/chats/group/${groupChat.chatId}/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: foundUser.uid }),
        }
      );

      if (!response.ok) {
        throw new Error("Không thể thêm thành viên");
      }

      alert("Thêm thành viên thành công!");
      setIsAddMemberModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error("Error adding member:", err);
      alert("Không thể thêm thành viên, vui lòng thử lại.");
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    try {
      const response = await fetch(
        `http://localhost:8080/api/chats/group/${groupChat.chatId}/remove`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: selectedMember.uid }),
        }
      );

      if (!response.ok) {
        throw new Error("Không thể xóa thành viên");
      }

      alert("Xóa thành viên thành công!");
      setIsRemoveMemberModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error("Error removing member:", err);
      alert("Không thể xóa thành viên, vui lòng thử lại.");
    }
  };

  const handleTransferAdmin = async () => {
    if (!selectedMember) return;
    try {
      const response = await fetch(
        `http://localhost:8080/api/chats/group/${groupChat.chatId}/transfer-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newAdminId: selectedMember.uid }),
        }
      );

      if (!response.ok) {
        throw new Error("Không thể nhường quyền admin");
      }

      alert("Nhường quyền admin thành công!");
      setIsTransferAdminModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error("Error transferring admin:", err);
      alert("Không thể nhường quyền admin, vui lòng thử lại.");
    }
  };

  const handleDissolveGroup = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn giải tán nhóm?")) return;
    try {
      const response = await fetch(
        `http://localhost:8080/api/chats/group/${groupChat.chatId}/dissolve`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Không thể giải tán nhóm");
      }

      alert("Giải tán nhóm thành công!");
      window.location.reload();
    } catch (err) {
      console.error("Error dissolving group:", err);
      alert("Không thể giải tán nhóm, vui lòng thử lại.");
    }
  };

  return (
    <div className="group-management">
      <h3>Quản lý nhóm</h3>
      <button
        className="show-members-btn"
        onClick={() => setShowMembers(!showMembers)}
      >
        <FaUsers size={20} /> Hiện danh sách thành viên
      </button>
      {showMembers && groupDetails?.participants && (
        <div className="member-list">
          <h4>Thành viên ({groupDetails.participants.length})</h4>
          <ul>
            {groupDetails.participants.map((member) => (
              <li key={member.uid} className="member-item">
                <img
                  src={member.avatarUrl || "/default-avatar.png"}
                  alt="member avatar"
                  className="member-avatar"
                  onError={(e) => {
                    e.target.src = "/default-avatar.png";
                  }}
                />
                <span>
                  {member.firstName} {member.lastName}
                  {groupChat.adminId === member.uid && (
                    <span className="admin-badge">
                      <FaCrown size={16} /> Admin
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="group-actions">
        <button
          className="action-btn add-member"
          onClick={() => setIsAddMemberModalOpen(true)}
          disabled={!isAdmin}
        >
          <FaUserPlus size={20} /> Thêm thành viên
        </button>
        <button
          className="action-btn remove-member"
          onClick={() => setIsRemoveMemberModalOpen(true)}
          disabled={!isAdmin}
        >
          <FaUserMinus size={20} /> Xóa thành viên
        </button>
        <button
          className="action-btn transfer-admin"
          onClick={() => setIsTransferAdminModalOpen(true)}
          disabled={!isAdmin}
        >
          <FaCrown size={20} /> Nhường quyền admin
        </button>
        <button
          className="action-btn dissolve-group"
          onClick={handleDissolveGroup}
          disabled={!isAdmin}
        >
          <FaTrash size={20} /> Giải tán nhóm
        </button>
      </div>

      <Modal
        isOpen={isAddMemberModalOpen}
        onRequestClose={() => setIsAddMemberModalOpen(false)}
        className="modal"
        overlayClassName="overlay"
      >
        <h3>Thêm thành viên mới</h3>
        <div className="search-form">
          <input
            type="email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            placeholder="Nhập email người dùng"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchUser();
            }}
          />
          <button onClick={handleSearchUser}>T

ìm</button>
        </div>
        {foundUser && (
          <div className="user-result">
            <p>
              👤 {foundUser.lastName} {foundUser.firstName}
            </p>
            <button className="add-btn" onClick={handleAddMember}>
              Thêm vào nhóm
            </button>
          </div>
        )}
        {showNotFound && <p className="not-found-msg">Không tìm thấy</p>}
        <button
          className="close-btn"
          onClick={() => setIsAddMemberModalOpen(false)}
        >
          Đóng
        </button>
      </Modal>

      <Modal
        isOpen={isRemoveMemberModalOpen}
        onRequestClose={() => setIsRemoveMemberModalOpen(false)}
        className="modal"
        overlayClassName="overlay"
      >
        <h3>Xóa thành viên</h3>
        <div className="member-list">
          <h4>Chọn thành viên để xóa</h4>
          <ul>
            {groupDetails?.participants
              ?.filter((member) => member.uid !== groupChat.adminId)
              .map((member) => (
                <li
                  key={member.uid}
                  className="member-item"
                  onClick={() => setSelectedMember(member)}
                >
                  <img
                    src={member.avatarUrl || "/default-avatar.png"}
                    alt="member avatar"
                    className="member-avatar"
                    onError={(e) => {
                      e.target.src = "/default-avatar.png";
                    }}
                  />
                  <span>
                    {member.firstName} {member.lastName}
                  </span>
                </li>
              ))}
          </ul>
        </div>
        {selectedMember && (
          <button className="remove-btn" onClick={handleRemoveMember}>
            Xóa {selectedMember.firstName} {selectedMember.lastName}
          </button>
        )}
        <button
          className="close-btn"
          onClick={() => setIsRemoveMemberModalOpen(false)}
        >
          Đóng
        </button>
      </Modal>

      <Modal
        isOpen={isTransferAdminModalOpen}
        onRequestClose={() => setIsTransferAdminModalOpen(false)}
        className="modal"
        overlayClassName="overlay"
      >
        <h3>Nhường quyền admin</h3>
        <div className="member-list">
          <h4>Chọn thành viên để nhường quyền</h4>
          <ul>
            {groupDetails?.participants
              ?.filter((member) => member.uid !== groupChat.adminId)
              .map((member) => (
                <li
                  key={member.uid}
                  className="member-item"
                  onClick={() => setSelectedMember(member)}
                >
                  <img
                    src={member.avatarUrl || "/default-avatar.png"}
                    alt="member avatar"
                    className="member-avatar"
                    onError={(e) => {
                      e.target.src = "/default-avatar.png";
                    }}
                  />
                  <span>
                    {member.firstName} {member.lastName}
                  </span>
                </li>
              ))}
          </ul>
        </div>
        {selectedMember && (
          <button className="transfer-btn" onClick={handleTransferAdmin}>
            Nhường quyền cho {selectedMember.firstName} {selectedMember.lastName}
          </button>
        )}
        <button
          className="close-btn"
          onClick={() => setIsTransferAdminModalOpen(false)}
        >
          Đóng
        </button>
      </Modal>
    </div>
  );
};

export default GroupManagement;