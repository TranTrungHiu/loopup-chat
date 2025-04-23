import React from 'react';
import FriendRequests from '../component/FriendRequests'; // Đường dẫn đến component FriendRequests

const InviteTab = ({ uid, token }) => {
  return (
    <div className="invite-tab-container">
      <FriendRequests uid={uid} token={token} />
    </div>
  );
};

export default InviteTab;