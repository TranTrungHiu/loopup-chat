package com.loopupchat.auth.controller;

import com.corundumstudio.socketio.SocketIOServer;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final SocketIOServer socketIOServer;

    // Tiêm SocketIOServer thông qua constructor
    public MessageController(SocketIOServer socketIOServer) {
        this.socketIOServer = socketIOServer;
    }

    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> request) {
        String chatId = request.get("chatId");
        String sender = request.get("sender");
        String message = request.get("message");

        Firestore firestore = FirestoreClient.getFirestore();
        CollectionReference messagesRef = firestore.collection("messages");
        DocumentReference chatRef = firestore.collection("chats").document(chatId);

        try {
            if (chatId == null || sender == null || message == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Dữ liệu không hợp lệ"));
            }

            // Kiểm tra xem đoạn chat đã tồn tại chưa
            DocumentSnapshot chatSnapshot = chatRef.get().get();
            if (!chatSnapshot.exists()) {
                // Nếu đoạn chat chưa tồn tại, tạo đoạn chat mới
                Map<String, Object> chatData = new HashMap<>();
                chatData.put("chatId", chatId);
                String[] participants = chatId.split("_");
                chatData.put("participants", Arrays.asList(participants[0], participants[1]));
                chatData.put("lastMessage", message);
                chatData.put("lastUpdated", new Date());
                chatRef.set(chatData);
            } else {
                // Nếu đoạn chat đã tồn tại, cập nhật thông tin đoạn chat
                chatRef.update("lastMessage", message, "lastUpdated", new Date());
            }

            // Generate unique message ID
            String messageId = UUID.randomUUID().toString();
            Date timestamp = new Date();

            // Lưu tin nhắn vào collection "messages" với ID xác định
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("id", messageId);
            messageData.put("chatId", chatId);
            messageData.put("sender", sender);
            messageData.put("message", message);
            messageData.put("timestamp", timestamp);
            messageData.put("status", "sent");

            // Lưu tin nhắn với ID được tạo
            messagesRef.document(messageId).set(messageData);

            // Thêm thông tin người đã đọc tin nhắn
            Map<String, Object> readReceipt = new HashMap<>();
            readReceipt.put(sender, timestamp);
            messageData.put("readBy", readReceipt);

            // Phát tin nhắn qua Socket.IO đến phòng chat tương ứng
            socketIOServer.getRoomOperations(chatId).sendEvent("new_message", messageData);

            // Thông báo cập nhật danh sách chat cho tất cả người tham gia
            String[] participants = chatId.split("_");
            for (String participant : participants) {
                socketIOServer.getRoomOperations("user_" + participant).sendEvent("chat_updated",
                        Map.of(
                                "chatId", chatId,
                                "lastMessage", message,
                                "lastUpdated", timestamp));
            }

            return ResponseEntity.ok(messageData);
        } catch (Exception e) {
            e.printStackTrace(); // Log lỗi chi tiết
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi gửi tin nhắn: " + e.getMessage()));
        }
    }

    @GetMapping("/{chatId}")
    public ResponseEntity<?> getMessages(@PathVariable String chatId) {
        Firestore firestore = FirestoreClient.getFirestore();
        CollectionReference messagesRef = firestore.collection("messages");

        try {
            if (chatId == null || chatId.isEmpty()) {
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

            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            e.printStackTrace(); // Log lỗi chi tiết
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy tin nhắn: " + e.getMessage()));
        }
    }

    @PostMapping("/{messageId}/read")
    public ResponseEntity<?> markMessageAsRead(
            @PathVariable String messageId,
            @RequestBody Map<String, String> request) {

        String userId = request.get("userId");
        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "userId không được để trống"));
        }

        Firestore firestore = FirestoreClient.getFirestore();
        DocumentReference messageRef = firestore.collection("messages").document(messageId);

        try {
            DocumentSnapshot messageDoc = messageRef.get().get();
            if (!messageDoc.exists()) {
                return ResponseEntity.notFound().build();
            }

            // Lấy thông tin tin nhắn
            Map<String, Object> messageData = messageDoc.getData();
            String chatId = (String) messageData.get("chatId");

            // Cập nhật người đọc tin nhắn
            Map<String, Object> updates = new HashMap<>();
            updates.put("readBy." + userId, new Date());
            messageRef.update(updates);

            // Thông báo cập nhật trạng thái đọc tin nhắn cho phòng chat
            Map<String, Object> readNotification = new HashMap<>();
            readNotification.put("messageId", messageId);
            readNotification.put("userId", userId);
            readNotification.put("timestamp", new Date());

            socketIOServer.getRoomOperations(chatId).sendEvent("message_read", readNotification);

            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi đánh dấu tin nhắn đã đọc: " + e.getMessage()));
        }
    }
}