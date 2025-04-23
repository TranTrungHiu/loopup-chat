import React, { useState, useEffect, useCallback } from "react";
import "../pages/styles/FriendRequests.css"; // Đường dẫn đến file CSS của bạn

const FriendRequests = ({ uid, token }) => {
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
    } finally {
      setLoading(false);
    }
  }, [uid, token]);
  
  // Lấy danh sách khi component được mount
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);
  
  // Xử lý chấp nhận lời mời kết bạn
  const handleAccept = async (requestId) => {
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
      
      // Thông báo thành công (có thể bỏ qua)
      alert("Đã chấp nhận lời mời kết bạn!");
    } catch (err) {
      console.error("Lỗi khi chấp nhận lời mời:", err);
      alert("Không thể chấp nhận lời mời kết bạn. Vui lòng thử lại sau.");
    }
  };
  
  // Xử lý từ chối lời mời kết bạn
  const handleReject = async (requestId) => {
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
    } catch (err) {
      console.error("Lỗi khi từ chối lời mời:", err);
      alert("Không thể từ chối lời mời kết bạn. Vui lòng thử lại sau.");
    }
  };
  
  return (
    <div className="friend-requests-container">
      <h2>Lời mời kết bạn</h2>
      
      <button className="refresh-requests" onClick={fetchRequests} disabled={loading}>
        {loading ? "⏳" : "🔄 Làm mới"}
      </button>
      
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
                  onClick={() => handleAccept(request.id)}
                >
                  Đồng ý
                </button>
                <button 
                  className="reject-button"
                  onClick={() => handleReject(request.id)}
                >
                  Từ chối
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-requests">
          <p>Không có lời mời kết bạn nào.</p>
        </div>
      )}
    </div>
  );
};

// Helper functions
function formatRequestTime(timestamp) {
  if (!timestamp) return "";
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Dưới 24 giờ
  if (diff < 86400000) {
    // Dưới 1 giờ
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} phút trước`;
    }
    // Dưới 24 giờ
    const hours = Math.floor(diff / 3600000);
    return `${hours} giờ trước`;
  }
  
  // Định dạng ngày tháng nếu quá 24 giờ
  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
    year: "numeric"
  });
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