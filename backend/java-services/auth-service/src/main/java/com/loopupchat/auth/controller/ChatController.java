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
    public ResponseEntity<?> createOrGetChat(@RequestBody Map<String, String> request) {
        String user1 = request.get("user1");
        String user2 = request.get("user2");
        String chatId = user1 + "_" + user2;

        Firestore firestore = FirestoreClient.getFirestore();
        DocumentReference chatRef = firestore.collection("chats").document(chatId);

        try {
            DocumentSnapshot snapshot = chatRef.get().get();
            if (snapshot.exists()) {
                return ResponseEntity.ok(snapshot.getData());
            } else {
                Map<String, Object> chatData = new HashMap<>();
                chatData.put("chatId", chatId);
                chatData.put("participants", Arrays.asList(user1, user2));
                chatData.put("lastMessage", "");
                chatData.put("lastUpdated", new Date());

                chatRef.set(chatData);
                return ResponseEntity.ok(chatData);
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

    // Tạo chat nhóm
    @PostMapping("/group")
    public ResponseEntity<?> createGroupChat(@RequestBody Map<String, Object> request) {
        String creatorId = (String) request.get("creatorId");
        List<String> memberIds = (List<String>) request.get("memberIds");
        String groupName = (String) request.getOrDefault("groupName", "Nhóm mới");

        if (creatorId == null || memberIds == null || memberIds.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu creatorId hoặc memberIds"));
        }

        // Thêm creator vào danh sách participants nếu chưa có
        if (!memberIds.contains(creatorId)) {
            memberIds.add(creatorId);
        }

        String chatId = UUID.randomUUID().toString(); // ChatId cho nhóm
        Firestore firestore = FirestoreClient.getFirestore();
        DocumentReference chatRef = firestore.collection("chats").document(chatId);

        try {
            Map<String, Object> chatData = new HashMap<>();
            chatData.put("chatId", chatId);
            chatData.put("participants", memberIds);
            chatData.put("lastMessage", "");
            chatData.put("lastUpdated", new Date());
            chatData.put("isGroupChat", true);
            chatData.put("adminId", creatorId);
            chatData.put("groupName", groupName);

            chatRef.set(chatData);

            return ResponseEntity.ok(chatData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi tạo nhóm chat: " + e.getMessage()));
        }
    }

    // Lấy danh sách nhóm chat của người dùng dựa theo userId
    // Author: Thong
    @GetMapping("/group")
    public ResponseEntity<?> getGroupChatsByUser(@RequestParam String userId) {
        Firestore firestore = FirestoreClient.getFirestore();
        CollectionReference chatsRef = firestore.collection("chats");

        try {
            // Query: chats mà participants chứa userId và isGroupChat = true
            Query query = chatsRef
                    .whereArrayContains("participants", userId)
                    .whereEqualTo("isGroupChat", true);

            List<QueryDocumentSnapshot> documents = query.get().get().getDocuments();

            List<Map<String, Object>> groupChats = new ArrayList<>();
            for (QueryDocumentSnapshot doc : documents) {
                Map<String, Object> chatData = new HashMap<>(doc.getData());
                chatData.put("chatId", doc.getId());
                groupChats.add(chatData);
            }

            return ResponseEntity.ok(groupChats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy thông tin nhóm chat: " + e.getMessage()));
        }
    }

}
