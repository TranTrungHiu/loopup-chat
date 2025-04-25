import React from 'react';
import FriendRequests from '../component/FriendRequests'; // Đường dẫn đến component FriendRequests
import './styles/InviteTab.css'; // Thêm import file CSS

const InviteTab = ({ uid, token, onClose }) => {
  return (
    <div className="invite-tab-container">
      <div className="modal-wrapper">
        <FriendRequests uid={uid} token={token} onClose={onClose} />
      </div>
    </div>
  );
};

export default InviteTab;