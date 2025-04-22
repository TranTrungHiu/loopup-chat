"use client";
import { useState, useEffect } from "react";

const mockFriends = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    email: "a@example.com",
    avatar: "https://i.pravatar.cc/100?img=1",
  },
  {
    id: "2",
    name: "Trần Thị B",
    email: "b@example.com",
    avatar: "https://i.pravatar.cc/100?img=2",
  },
  {
    id: "3",
    name: "Lê Văn C",
    email: "c@example.com",
    avatar: "https://i.pravatar.cc/100?img=3",
  },
];

const FriendTab = ({ uid }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    fetch(`http://localhost:8080/api/friends/list/${uid}`)
      .then((res) => {
        if (!res.ok) throw new Error("Fetch error");
        return res.json();
      })
      .then((data) => setFriends(data))
      .catch((err) => {
        console.error("Lỗi lấy danh sách bạn bè:", err);
        setFriends(mockFriends); // fallback
      })
      .finally(() => setLoading(false));
  }, [uid]);

  return (
    <div className="w-full flex flex-col items-center justify-center p-6">
      <h2 className="text-2xl font-bold mb-6">👥 Danh sách bạn bè</h2>

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : friends.length === 0 ? (
        <p className="text-gray-400 italic">Bạn chưa có bạn bè nào.</p>
      ) : (
        <div className="w-full max-w-3xl flex flex-col gap-4">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="flex flex-col sm:flex-row items-center sm:items-center bg-white border rounded-xl shadow-sm p-4 hover:shadow-md transition"
            >
              <img
                src={friend.avatar || "/default-avatar.png"}
                alt={friend.name}
                className="w-16 h-16 rounded-full object-cover mb-3 sm:mb-0 sm:mr-4"
              />
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold">{friend.name}</h3>
                <p className="text-sm text-gray-500">{friend.email}</p>
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-auto flex gap-2">
                <button className="bg-blue-500 text-white px-4 py-1 rounded-xl text-sm hover:bg-blue-600">
                  Nhắn tin
                </button>
                <button className="bg-gray-100 text-gray-700 px-4 py-1 rounded-xl text-sm hover:bg-gray-200">
                  Thông tin
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendTab;
