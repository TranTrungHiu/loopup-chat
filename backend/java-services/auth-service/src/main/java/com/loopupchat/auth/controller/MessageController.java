package com.loopupchat.auth.controller;

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

@RestController
@RequestMapping("/api/messages")
public class MessageController {

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
                chatData.put("participants", Arrays.asList(sender, chatId.split("_")[0]));
                chatData.put("lastMessage", message);
                chatData.put("lastUpdated", new Date());
                chatRef.set(chatData);
            } else {
                // Nếu đoạn chat đã tồn tại, cập nhật thông tin đoạn chat
                chatRef.update("lastMessage", message, "lastUpdated", new Date());
            }

            // Lưu tin nhắn vào collection "messages"
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("chatId", chatId);
            messageData.put("sender", sender);
            messageData.put("message", message);
            messageData.put("timestamp", new Date());
            messagesRef.add(messageData);

            return ResponseEntity.ok(Map.of("status", "success"));
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
}
