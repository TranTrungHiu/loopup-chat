package com.loopupchat.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;

import java.util.*;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    @PostMapping
    public ResponseEntity<?> createOrGetChat(@RequestBody Map<String, Object> request) {
        Firestore firestore = FirestoreClient.getFirestore();
        CollectionReference chatsRef = firestore.collection("chats");

        try {
            // Lấy thông tin từ request
            boolean isGroupChat = request.get("isGroupChat") != null && (Boolean) request.get("isGroupChat");

            if (isGroupChat) {
                // Tạo nhóm chat
                String adminId = (String) request.get("adminId");
                List<String> memberIds = (List<String>) request.get("memberIds");
                String groupName = (String) request.getOrDefault("groupName", "Nhóm mới");

                if (adminId == null) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Thiếu adminId"));
                } else if (memberIds == null || memberIds.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Thiếu danh sách thành viên"));
                }

                // Đảm bảo adminId nằm trong danh sách participants
                if (!memberIds.contains(adminId)) {
                    memberIds.add(adminId);
                }

                String chatId = UUID.randomUUID().toString();
                DocumentReference chatRef = chatsRef.document(chatId);

                Map<String, Object> chatData = new HashMap<>();
                chatData.put("chatId", chatId);
                chatData.put("participants", memberIds);
                chatData.put("lastMessage", "");
                chatData.put("lastUpdated", new Date());
                chatData.put("isGroupChat", true);
                chatData.put("adminId", adminId);
                chatData.put("groupName", groupName);

                chatRef.set(chatData);
                return ResponseEntity.ok(chatData);
            } else {
                // Tạo hoặc lấy chat 1-1
                String user1 = (String) request.get("user1");
                String user2 = (String) request.get("user2");

                if (user1 == null || user2 == null) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Thiếu user1 hoặc user2"));
                }

                // Tạo chatId theo định dạng cố định để đảm bảo không bị lặp
                String chatId = user1.compareTo(user2) < 0 ? user1 + "_" + user2 : user2 + "_" + user1;
                DocumentReference chatRef = chatsRef.document(chatId);
                DocumentSnapshot snapshot = chatRef.get().get();

                if (snapshot.exists()) {
                    return ResponseEntity.ok(snapshot.getData());
                } else {
                    Map<String, Object> chatData = new HashMap<>();
                    chatData.put("chatId", chatId);
                    chatData.put("participants", Arrays.asList(user1, user2));
                    chatData.put("lastMessage", "");
                    chatData.put("lastUpdated", new Date());
                    chatData.put("isGroupChat", false);

                    chatRef.set(chatData);
                    return ResponseEntity.ok(chatData);
                }
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi tạo hoặc lấy cuộc trò chuyện: " + e.getMessage()));
        }
    }

    @GetMapping("")
    public ResponseEntity<?> getAllChats(@RequestParam(required = false) String userId) {
        Firestore firestore = FirestoreSingleton.getFirestore();
        CollectionReference chatsRef = firestore.collection("chats");

        try {
            // Nếu có userId, lọc chat chỉ thuộc về người dùng đó
            if (userId != null && !userId.isEmpty()) {
                // Thực hiện query Firestore để lấy chat có chứa userId trong participants
                Query query = chatsRef.whereArrayContains("participants", userId);
                ApiFuture<QuerySnapshot> future = query.get();
                List<QueryDocumentSnapshot> documents = future.get().getDocuments();

                List<Object> chatList = new ArrayList<>();
                for (QueryDocumentSnapshot doc : documents) {
                    // Lưu ID của document vào dữ liệu trả về
                    Map<String, Object> chatData = new HashMap<>(doc.getData());
                    chatData.put("chatId", doc.getId());
                    chatList.add(chatData);
                }
                System.out.println("ChatList: " + chatList);

                return ResponseEntity.ok(chatList);
            } else {
                // Nếu không có userId, trả về tất cả chat (có thể giới hạn số lượng)
                ApiFuture<QuerySnapshot> future = chatsRef.limit(100).get();
                List<QueryDocumentSnapshot> documents = future.get().getDocuments();

                List<Object> chatList = new ArrayList<>();
                for (QueryDocumentSnapshot doc : documents) {
                    Map<String, Object> chatData = new HashMap<>(doc.getData());
                    chatData.put("chatId", doc.getId());
                    chatList.add(chatData);
                }

                return ResponseEntity.ok(chatList);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy danh sách chat: " + e.getMessage()));
        }
    }

    @GetMapping("/{chatId}")
    public ResponseEntity<?> getMessages(@PathVariable String chatId) {
        Firestore firestore = FirestoreSingleton.getFirestore();
        CollectionReference messagesRef = firestore.collection("messages");

        try {
            if (chatId == null || chatId.isEmpty()) {
                System.err.println("chatId không hợp lệ: " + chatId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "chatId không được để trống"));
            }

            // Truy vấn tin nhắn theo chatId và sắp xếp theo thời gian
            Query query = messagesRef.whereEqualTo("chatId", chatId).orderBy("timestamp", Query.Direction.ASCENDING);
            List<QueryDocumentSnapshot> documents = query.get().get().getDocuments();

            // Chuyển đổi kết quả thành danh sách tin nhắn
            List<Map<String, Object>> messages = new ArrayList<>();
            for (QueryDocumentSnapshot doc : documents) {
                messages.add(doc.getData());
            }

            System.out.println("Lấy tin nhắn thành công cho chatId: " + chatId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            e.printStackTrace(); // Log lỗi chi tiết
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy tin nhắn: " + e.getMessage()));
        }
    }

    // Lấy thông tin participant khác trong cuộc trò chuyện 1-1
    @GetMapping("/{chatId}/participant")
    public ResponseEntity<?> getParticipantInfo(@PathVariable String chatId, @RequestParam String currentUserId) {
        Firestore firestore = FirestoreSingleton.getFirestore();
        DocumentReference chatRef = firestore.collection("chats").document(chatId);

        try {
            // Lấy thông tin cuộc trò chuyện
            DocumentSnapshot chatSnapshot = chatRef.get().get();
            if (!chatSnapshot.exists()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy cuộc trò chuyện với chatId: " + chatId));
            }

            // Lấy danh sách participants
            List<String> participants = (List<String>) chatSnapshot.get("participants");
            if (participants == null || participants.size() < 2) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Participants không hợp lệ"));
            }

            // Xác định participant khác (người dùng khác)
            String otherUserId = participants.get(0).equals(currentUserId) ? participants.get(1) : participants.get(0);

            // Lấy thông tin người dùng từ Firestore
            DocumentReference userRef = firestore.collection("users").document(otherUserId);
            DocumentSnapshot userSnapshot = userRef.get().get();
            if (!userSnapshot.exists()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy thông tin người dùng với ID: " + otherUserId));
            }

            // Trả về thông tin người dùng
            return ResponseEntity.ok(userSnapshot.getData());
        } catch (Exception e) {
            e.printStackTrace(); // Log lỗi chi tiết
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy thông tin participant: " + e.getMessage()));
        }
    }

    // Lấy danh sách thành viên trong nhóm chat
    // Trả về thông tin là chuỗi Users
    @GetMapping("/{chatId}/members")
    public ResponseEntity<?> getGroupMembers(@PathVariable String chatId) {
        Firestore firestore = FirestoreClient.getFirestore();
        DocumentReference chatRef = firestore.collection("chats").document(chatId);

        try {
            DocumentSnapshot snapshot = chatRef.get().get();
            if (!snapshot.exists() || !Boolean.TRUE.equals(snapshot.getBoolean("isGroupChat"))) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Không tìm thấy nhóm hoặc không phải nhóm chat"));
            }

            List<String> memberIds = (List<String>) snapshot.get("participants");

            List<Map<String, Object>> members = new ArrayList<>();
            for (String uid : memberIds) {
                DocumentSnapshot userSnap = firestore.collection("users").document(uid).get().get();
                if (userSnap.exists())
                    members.add(userSnap.getData());
            }

            return ResponseEntity.ok(members);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy danh sách thành viên: " + e.getMessage()));
        }
    }

    // Thêm thành viên vào nhóm chat
    // Trả về Message
    @PostMapping("/{chatId}/add-member")
    public ResponseEntity<?> addMember(@PathVariable String chatId, @RequestBody Map<String, Object> body) {
        String newMemberId = (String) body.get("userId");
        Firestore firestore = FirestoreClient.getFirestore();
        DocumentReference chatRef = firestore.collection("chats").document(chatId);

        try {
            DocumentSnapshot snapshot = chatRef.get().get();
            if (!snapshot.exists() || !Boolean.TRUE.equals(snapshot.getBoolean("isGroupChat"))) {
                return ResponseEntity.badRequest().body(Map.of("message", "Không phải nhóm chat hợp lệ"));
            }

            List<String> members = (List<String>) snapshot.get("participants");
            if (members.contains(newMemberId)) {
                return ResponseEntity.ok(Map.of("message", "Người dùng đã ở trong nhóm"));
            }

            members.add(newMemberId);
            chatRef.update("participants", members);

            return ResponseEntity.ok(Map.of("message", "Đã thêm thành viên"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi thêm thành viên: " + e.getMessage()));
        }
    }

    // Xoá thành viên khỏi nhóm chat
    // Trả về Message
    @PostMapping("/{chatId}/remove-member")
    public ResponseEntity<?> removeMember(@PathVariable String chatId, @RequestBody Map<String, Object> body) {
        String memberId = (String) body.get("userId");
        Firestore firestore = FirestoreClient.getFirestore();

        // lấy danh sách chats
        DocumentReference chatRef = firestore.collection("chats").document(chatId);

        try {
            DocumentSnapshot snapshot = chatRef.get().get();
            List<String> members = (List<String>) snapshot.get("participants");

            // Remove người dùng đó
            members.remove(memberId);
            // Cập nhật lại danh sách participants trong Firestore
            chatRef.update("participants", members);

            return ResponseEntity.ok(Map.of("message", "Đã xoá thành viên"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi xoá thành viên: " + e.getMessage()));
        }
    }

    @PostMapping("/{chatId}/transfer-admin")
    public ResponseEntity<?> transferAdmin(@PathVariable String chatId, @RequestBody Map<String, Object> body) {
        String userId = (String) body.get("userId");
        Firestore firestore = FirestoreClient.getFirestore();
        DocumentReference chatRef = firestore.collection("chats").document(chatId);

        try {
            DocumentSnapshot snapshot = chatRef.get().get();
            List<String> members = (List<String>) snapshot.get("participants");

            chatRef.update("adminId", userId);
            return ResponseEntity.ok(Map.of("message", "Đã nhượng quyền admin"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi nhượng quyền admin: " + e.getMessage()));
        }
    }

    // Xóa nhóm chat
    @DeleteMapping("/{chatId}")
    public ResponseEntity<?> deleteChat(@PathVariable String chatId) {
        Firestore firestore = FirestoreClient.getFirestore();
        DocumentReference chatRef = firestore.collection("chats").document(chatId);
        CollectionReference messagesRef = firestore.collection("messages");

        try {
            // Xoá document chat chính
            chatRef.delete();

            // Lấy và xoá tất cả messages thuộc chatId này
            Query query = messagesRef.whereEqualTo("chatId", chatId);
            ApiFuture<QuerySnapshot> future = query.get();
            List<QueryDocumentSnapshot> messages = future.get().getDocuments();

            for (QueryDocumentSnapshot message : messages) {
                message.getReference().delete();
            }

            return ResponseEntity.ok(Map.of("message", "Đã xoá nhóm và toàn bộ tin nhắn."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi xoá nhóm: " + e.getMessage()));
        }
    }

}
