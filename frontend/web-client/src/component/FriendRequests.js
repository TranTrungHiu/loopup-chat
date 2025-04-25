import React, { useState, useEffect, useCallback } from "react";
import "../pages/styles/FriendRequests.css"; // Đường dẫn đến file CSS của bạn
import { FaSyncAlt, FaUserCheck, FaUserTimes, FaBell, FaTimes, FaUserPlus } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/Toast.css";

const FriendRequests = ({ uid, token, onClose }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lấy danh sách lời mời kết bạn
  const fetchRequests = useCallback(async () => {
    if (!uid || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `http://localhost:8080/api/friends/requests/${uid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error("Không thể tải danh sách lời mời kết bạn");
      }
      
      const data = await response.json();
      console.log("Lời mời kết bạn:", data);
      
      // Sắp xếp theo thời gian tạo mới nhất
      const sortedRequests = Array.isArray(data) 
        ? data.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          })
        : [];
      
      setRequests(sortedRequests);
    } catch (err) {
      console.error("Lỗi khi lấy lời mời kết bạn:", err);
      setError("Không thể tải danh sách lời mời kết bạn");
      toast.error("Không thể tải danh sách lời mời kết bạn", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored"
      });
    } finally {
      setLoading(false);
    }
  }, [uid, token]);
  
  // Lấy danh sách khi component được mount
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);
  
  // Xử lý chấp nhận lời mời kết bạn
  const handleAccept = async (requestId, userName) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/friends/accept/${requestId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error("Không thể chấp nhận lời mời kết bạn");
      }
      
      // Cập nhật lại danh sách sau khi chấp nhận
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Thông báo thành công với toast
      toast.success(
        <div className="custom-toast">
          <FaUserCheck className="toast-icon" />
          <div className="toast-message">
            <strong>Thành công!</strong><br />
            Bạn và {userName} đã trở thành bạn bè
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored"
        }
      );
    } catch (err) {
      console.error("Lỗi khi chấp nhận lời mời:", err);
      toast.error("Không thể chấp nhận lời mời kết bạn. Vui lòng thử lại sau.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored"
      });
    }
  };
  
  // Xử lý từ chối lời mời kết bạn
  const handleReject = async (requestId, userName) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/friends/reject/${requestId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error("Không thể từ chối lời mời kết bạn");
      }
      
      // Cập nhật lại danh sách sau khi từ chối
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Thông báo đã từ chối thành công
      toast.info(
        <div className="custom-toast">
          <FaUserTimes className="toast-icon" />
          <div className="toast-message">
            Đã từ chối lời mời kết bạn từ {userName}
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored"
        }
      );
    } catch (err) {
      console.error("Lỗi khi từ chối lời mời:", err);
      toast.error("Không thể từ chối lời mời kết bạn. Vui lòng thử lại sau.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored"
      });
    }
  };
  
  return (
    <div className="friend-requests-container">
      <div className="friend-requests-header">
        <div className="header-title">
          <FaBell className="request-icon" />
          <h2>Lời mời kết bạn</h2>
        </div>
        <div className="header-actions">
          <button className="refresh-requests" onClick={fetchRequests} disabled={loading} title="Làm mới">
            {loading ? "⏳" : <FaSyncAlt />}
          </button>
          <button className="close-requests" onClick={onClose} title="Đóng">
            <FaTimes />
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-requests">
          <div className="loading-spinner"></div>
          <p>Đang tải lời mời kết bạn...</p>
        </div>
      ) : error ? (
        <div className="request-error">
          <p>{error}</p>
          <button onClick={fetchRequests}>Thử lại</button>
        </div>
      ) : requests.length > 0 ? (
        <ul className="request-list">
          {requests.map((request) => (
            <li key={request.id} className="request-item">
              <div className="request-user-info">
                <div 
                  className="request-user-avatar"
                  style={
                    request.fromUser.avatarUrl 
                      ? { backgroundImage: `url(${request.fromUser.avatarUrl})` }
                      : { backgroundColor: getUserColor(request.fromUser.firstName, request.fromUser.lastName) }
                  }
                >
                  {!request.fromUser.avatarUrl && getInitials(request.fromUser.firstName, request.fromUser.lastName)}
                </div>
                <div className="request-user-details">
                  <h3>{request.fromUser.firstName} {request.fromUser.lastName}</h3>
                  <p>{request.fromUser.email}</p>
                  <p className="request-time">
                    {formatRequestTime(request.createdAt)}
                  </p>
                </div>
              </div>
              <div className="request-actions">
                <button 
                  className="accept-button"
                  onClick={() => handleAccept(
                    request.id, 
                    `${request.fromUser.firstName} ${request.fromUser.lastName}`
                  )}
                >
                  <FaUserCheck /> Đồng ý
                </button>
                <button 
                  className="reject-button"
                  onClick={() => handleReject(
                    request.id,
                    `${request.fromUser.firstName} ${request.fromUser.lastName}`
                  )}
                >
                  <FaUserTimes /> Từ chối
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-requests">
          <div className="empty-state-icon">
            <FaUserPlus />
          </div>
          <p>Không có lời mời kết bạn nào.</p>
          <p className="empty-subtitle">Khi có người gửi lời mời kết bạn, bạn sẽ thấy ở đây.</p>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

// Helper functions
function formatRequestTime(createdAt) {
  if (!createdAt || typeof createdAt !== "object" || !createdAt.seconds) return "";

  const createdDate = new Date(createdAt.seconds * 1000); // convert seconds to milliseconds
  const now = new Date();
  const diff = Math.floor((now - createdDate) / 1000); // diff in seconds

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} tuần trước`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`;
  return `${Math.floor(diff / 31536000)} năm trước`;
}

function getInitials(firstName, lastName) {
  const firstInitial = firstName ? firstName.charAt(0) : '';
  const lastInitial = lastName ? lastName.charAt(0) : '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

function getUserColor(firstName, lastName) {
  const nameString = `${firstName || ''}${lastName || ''}`;
  let hash = 0;
  for (let i = 0; i < nameString.length; i++) {
    hash = nameString.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 70%, 75%)`;
}

export default FriendRequests;