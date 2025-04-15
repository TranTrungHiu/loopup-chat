package com.loopupchat.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
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

    @GetMapping
    public ResponseEntity<?> getAllChats() {
        Firestore firestore = FirestoreSingleton.getFirestore();
        CollectionReference chatsRef = firestore.collection("chats");

        try {
            // Truy vấn tất cả các cuộc trò chuyện
            List<QueryDocumentSnapshot> documents = chatsRef.get().get().getDocuments();

            // Chuyển đổi kết quả thành danh sách các cuộc trò chuyện
            List<Map<String, Object>> chats = new ArrayList<>();
            for (QueryDocumentSnapshot doc : documents) {
                chats.add(doc.getData());
            }

            return ResponseEntity.ok(chats);
        } catch (Exception e) {
            e.printStackTrace(); // Log lỗi chi tiết
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy danh sách cuộc trò chuyện: " + e.getMessage()));
        }
    }
}
