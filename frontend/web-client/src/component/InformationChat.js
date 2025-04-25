import React, { useState, useEffect } from "react";
import "../pages/styles/InformationChat.css";
import { FaUser, FaUsers, FaPencilAlt, FaSignOutAlt } from "react-icons/fa";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import GroupManagement from "./GroupManagement";

const InformationChat = ({ user, isGroupChat, groupChat, isAdmin }) => {
  const [showMembers, setShowMembers] = useState(false);
  const [groupDetails, setGroupDetails] = useState(null);
  const token = localStorage.getItem("idToken");
  const uid = localStorage.getItem("uid");

  useEffect(() => {
    if (isGroupChat && groupChat?.chatId) {
      fetch(`http://localhost:8080/api/chats/group/${groupChat.chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setGroupDetails(data))
        .catch((err) => console.error("Error fetching group details:", err));
    }
  }, [isGroupChat, groupChat, token]);

  const handleLeaveGroup = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/chats/group/${groupChat.chatId}/leave`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: uid }),
        }
      );

      if (!response.ok) {
        throw new Error("Không thể rời nhóm");
      }

      alert("Bạn đã rời nhóm thành công!");
      window.location.reload();
    } catch (err) {
      console.error("Error leaving group:", err);
      alert("Không thể rời nhóm, vui lòng thử lại.");
    }
  };

  return (
    <div className="information-chat">
      <div className="chat-info-header">
        <div className="avatar-section">
          <img
            src={
              isGroupChat
                ? groupChat?.avataGroupChatUrl || "/default-group-avatar.png"
                : user?.avatarUrl || "/default-avatar.png"
            }
            alt={isGroupChat ? "group avatar" : "user avatar"}
            className="avatar"
            onError={(e) => {
              e.target.src = isGroupChat
                ? "/default-group-avatar.png"
                : "/default-avatar.png";
            }}
          />
          <h2>
            {isGroupChat
              ? groupChat?.groupName || "Nhóm không tên"
              : `${user?.firstName} ${user?.lastName}`}
          </h2>
        </div>
      </div>

      {isGroupChat ? (
        <>
          <div className="group-details">
            <p>
              <strong>Tên nhóm:</strong> {groupChat?.groupName || "Nhóm không tên"}
            </p>
            <p>
              <strong>Admin:</strong>{" "}
              {groupDetails?.admin?.firstName} {groupDetails?.admin?.lastName}
            </p>
            <button
              className="show-members-btn"
              onClick={() => setShowMembers(!showMembers)}
            >
              <FaUsers size={20} /> Hiện danh sách thành viên
            </button>
            {showMembers && groupDetails?.participants && (
              <div className="member-list">
                <h3>Thành viên ({groupDetails.participants.length})</h3>
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
                            <MdOutlineAdminPanelSettings size={16} /> Admin
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {isAdmin && (
            <GroupManagement
              groupChat={groupChat}
              groupDetails={groupDetails}
              isAdmin={isAdmin}
            />
          )}
          <button className="leave-group-btn" onClick={handleLeaveGroup}>
            <FaSignOutAlt size={20} /> Rời nhóm
          </button>
        </>
      ) : (
        <div className="user-details">
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Giới tính:</strong>{" "}
            {user?.gender === "male" ? "Nam" : "Nữ"}
          </p>
          <button className="update-btn">
            <FaPencilAlt size={20} /> Cập nhật
          </button>
        </div>
      )}
    </div>
  );
};

export default InformationChat;