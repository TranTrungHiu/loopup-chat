import React, { useState, useMemo } from "react";
import Modal from "react-modal";
import { FaTimes, FaSearch, FaCheck, FaUsers, FaUser } from "react-icons/fa";
import "../component/styles/ForwardMessageModal.css";

const ForwardMessageModal = ({
  isOpen,
  onClose,
  friends = [],
  groups = [],
  onForward,
  loading = false,
}) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  // Lọc bạn bè và nhóm theo search
  const filteredFriends = useMemo(() =>
    friends.filter(f =>
      (`${f.lastName} ${f.firstName}`.toLowerCase().includes(search.toLowerCase()) ||
      f.email?.toLowerCase().includes(search.toLowerCase()))
    ), [search, friends]
  );
  const filteredGroups = useMemo(() =>
    groups.filter(g =>
      g.groupName?.toLowerCase().includes(search.toLowerCase())
    ), [search, groups]
  );

  // Thêm/xóa người nhận
  const toggleSelect = (item, type) => {
    const id = type === "group" ? `group-${item.chatId}` : `user-${item.uid}`;
    if (selected.some(s => s.id === id)) {
      setSelected(selected.filter(s => s.id !== id));
    } else {
      setSelected([...selected, { ...item, type, id }]);
    }
  };

  // Xóa khỏi danh sách đã chọn
  const removeSelected = (id) => {
    setSelected(selected.filter(s => s.id !== id));
  };

  // Chuyển tiếp
  const handleForward = () => {
  if (selected.length > 0 && typeof onForward === "function") {
    onForward([...selected]);
    setSelected([]);
    setSearch("");
  }
};

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="forward-modal"
      overlayClassName="forward-modal-overlay"
      ariaHideApp={false}
    >
      <div className="forward-modal-header">
        <span>Chuyển tiếp tin nhắn</span>
        <button className="close-btn" onClick={onClose}><FaTimes /></button>
      </div>
      <div className="forward-modal-search">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Tìm bạn hoặc nhóm..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="forward-modal-list">
        <div className="list-section">
          <div className="section-title"><FaUser /> Bạn bè</div>
          {filteredFriends.length === 0 && <div className="empty-list">Không tìm thấy bạn bè</div>}
          {filteredFriends.map(friend => {
            const id = `user-${friend.uid}`;
            const isSelected = selected.some(s => s.id === id);
            return (
              <div
                key={id}
                className={`list-item${isSelected ? " selected" : ""}`}
                onClick={() => toggleSelect(friend, "user")}
              >
                <img
                  src={friend.avatarUrl || "/default-avatar.png"}
                  alt="avatar"
                  className="avatar"
                  onError={e => { e.target.src = "/default-avatar.png"; }}
                />
                <span className="name">{friend.lastName} {friend.firstName}</span>
                {isSelected && <FaCheck className="selected-icon" />}
              </div>
            );
          })}
        </div>
        <div className="list-section">
          <div className="section-title"><FaUsers /> Nhóm chat</div>
          {filteredGroups.length === 0 && <div className="empty-list">Không tìm thấy nhóm</div>}
          {filteredGroups.map(group => {
            const id = `group-${group.chatId}`;
            const isSelected = selected.some(s => s.id === id);
            return (
              <div
                key={id}
                className={`list-item${isSelected ? " selected" : ""}`}
                onClick={() => toggleSelect(group, "group")}
              >
                <div className="group-avatar">{group.groupName?.charAt(0) || "G"}</div>
                <span className="name">{group.groupName}</span>
                {isSelected && <FaCheck className="selected-icon" />}
              </div>
            );
          })}
        </div>
      </div>
      <div className="forward-modal-selected">
        {selected.map(s => (
          <div className="selected-chip" key={s.id}>
            {s.type === "group" ? <FaUsers /> : <FaUser />}
            <span>{s.type === "group" ? s.groupName : `${s.lastName} ${s.firstName}`}</span>
            <button onClick={() => removeSelected(s.id)}><FaTimes /></button>
          </div>
        ))}
      </div>
      <div className="forward-modal-footer">
        <button
          className="forward-btn"
          disabled={selected.length === 0 || loading}
          onClick={handleForward}
        >
          {loading ? "Đang chuyển tiếp..." : "Chuyển tiếp"}
        </button>
      </div>
    </Modal>
  );
};

export default ForwardMessageModal;