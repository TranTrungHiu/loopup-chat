import React, { useState } from "react";
import Modal from "react-modal";
import { FaSearch } from "react-icons/fa";
import "../pages/styles/FindFriendModal.css"; // Đường dẫn đến file CSS của bạn

const FindFriendModal = ({ isOpen, onClose, uid, token }) => {
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [friendStatus, setFriendStatus] = useState("unknown"); // unknown, none, pending, accepted
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Hàm tìm kiếm người dùng qua email
  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      setErrorMessage("Vui lòng nhập email để tìm kiếm");
      return;
    }

    setIsSearching(true);
    setErrorMessage("");
    setFoundUser(null);
    setFriendStatus("unknown");
    setSuccessMessage("");

    try {
      // Gọi API tìm kiếm người dùng
      const response = await fetch(
        `http://localhost:8080/api/user/search?email=${encodeURIComponent(searchEmail)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Không tìm thấy người dùng với email này");
      }

      const data = await response.json();

      // Kiểm tra kết quả
      if (!data || !data.id) {
        setErrorMessage("Không tìm thấy người dùng với email này");
        return;
      }

      // Không cho phép tìm kiếm chính mình
      if (data.id === uid) {
        setErrorMessage("Đây là email của bạn");
        return;
      }

      console.log("Tìm thấy người dùng:", data);
      setFoundUser(data);

      // Kiểm tra trạng thái kết bạn
      await checkFriendStatus(data.id);
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error);
      setErrorMessage(error.message || "Lỗi khi tìm kiếm người dùng");
    } finally {
      setIsSearching(false);
    }
  };

  // Kiểm tra trạng thái kết bạn
  const checkFriendStatus = async (targetUserId) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/friends/status?user1=${uid}&user2=${targetUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Lỗi khi kiểm tra trạng thái kết bạn");
        setFriendStatus("unknown");
        return;
      }

      const statusData = await response.json();
      console.log("Trạng thái kết bạn:", statusData);

      // Cập nhật trạng thái kết bạn
      if (statusData.status) {
        setFriendStatus(statusData.status);
      } else {
        setFriendStatus("none");
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái kết bạn:", error);
      setFriendStatus("unknown");
    }
  };

  // Gửi lời mời kết bạn
  const handleSendFriendRequest = async () => {
    if (!foundUser || !foundUser.id) return;

    try {
      setIsSearching(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch("http://localhost:8080/api/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromUserId: uid,
          toUserId: foundUser.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi gửi lời mời kết bạn");
      }

      console.log("Đã gửi lời mời kết bạn");
      setFriendStatus("pending");
      setSuccessMessage("Đã gửi lời mời kết bạn thành công!");
    } catch (error) {
      console.error("Lỗi khi gửi lời mời kết bạn:", error);
      setErrorMessage(error.message || "Không thể gửi lời mời kết bạn");
    } finally {
      setIsSearching(false);
    }
  };

  // Xử lý khi nhấn Enter trong ô tìm kiếm
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearchUser();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="find-friend-modal"
      overlayClassName="find-friend-overlay"
      contentLabel="Tìm bạn qua email"
    >
      <div className="find-friend-header">
        <h2>Tìm bạn qua email</h2>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
      </div>

      <div className="find-friend-content">
        <div className="search-container">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Nhập email của bạn bè"
            onKeyDown={handleKeyDown}
            disabled={isSearching}
          />
          <button
            className="search-button"
            onClick={handleSearchUser}
            disabled={isSearching}
          >
            {isSearching ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        {foundUser && (
          <div className="user-result">
            <div className="user-info">
              <div 
                className="user-avatar"
                style={{
                  backgroundImage: foundUser.avatarUrl ? `url(${foundUser.avatarUrl})` : undefined,
                  backgroundColor: !foundUser.avatarUrl ? '#' + Math.floor(Math.random()*16777215).toString(16) : undefined
                }}
              >
                {!foundUser.avatarUrl && `${foundUser.firstName?.charAt(0) || ''}${foundUser.lastName?.charAt(0) || ''}`.toUpperCase()}
              </div>
              <div className="user-details">
                <h3>
                  {foundUser.firstName} {foundUser.lastName}
                </h3>
                <p>{foundUser.email}</p>
              </div>
            </div>

            <div className="action-buttons">
              {friendStatus === "accepted" && (
                <button className="already-friend-button" disabled>
                  Đã là bạn bè
                </button>
              )}
              {friendStatus === "pending" && (
                <button className="pending-button" disabled>
                  Đã gửi lời mời
                </button>
              )}
              {(friendStatus === "none" || friendStatus === "unknown") && (
                <button
                  className="add-friend-button"
                  onClick={handleSendFriendRequest}
                  disabled={isSearching}
                >
                  {isSearching ? "Đang gửi..." : "Gửi lời mời kết bạn"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default FindFriendModal;