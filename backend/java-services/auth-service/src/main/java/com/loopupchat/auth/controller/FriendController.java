package com.loopupchat.auth.controller;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    @PostMapping("/request")
    public ResponseEntity<?> sendFriendRequest(@RequestBody Map<String, String> body) {
        String fromUserId = body.get("fromUserId");
        String toUserId = body.get("toUserId");

        if (fromUserId == toUserId) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "không kết bạn với chính mình"));
        }

        if (fromUserId == null || toUserId == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "fromUserId và toUserId là bắt buộc"));
        }

        Firestore firestore = FirestoreSingleton.getFirestore();

        try {
            // Tạo reference cho document trong collection friendRequests
            CollectionReference requestsRef = firestore.collection("friendRequests");

            // Kiểm tra xem lời mời đã tồn tại chưa
            Query query = requestsRef
                    .whereEqualTo("fromUserId", fromUserId)
                    .whereEqualTo("toUserId", toUserId);

            ApiFuture<QuerySnapshot> querySnapshot = query.get();
            List<QueryDocumentSnapshot> documents = querySnapshot.get().getDocuments();

            if (!documents.isEmpty()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "Lời mời kết bạn đã tồn tại"));
            }

            // Tạo request mới
            Map<String, Object> request = new HashMap<>();
            request.put("fromUserId", fromUserId);
            request.put("toUserId", toUserId);
            request.put("status", "pending");
            request.put("createdAt", FieldValue.serverTimestamp());

            // Lưu request vào Firestore
            ApiFuture<DocumentReference> addedDocRef = requestsRef.add(request);
            String requestId = addedDocRef.get().getId();

            return ResponseEntity.ok(Map.of(
                    "message", "Đã gửi lời mời kết bạn thành công",
                    "requestId", requestId));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi gửi lời mời kết bạn: " + e.getMessage()));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> checkFriendshipStatus(
            @RequestParam String user1,
            @RequestParam String user2) {

        Firestore firestore = FirestoreSingleton.getFirestore();

        try {
            // Kiểm tra xem đã là bạn bè chưa
            CollectionReference friendsRef = firestore.collection("friends");

            // Kiểm tra cả hai chiều (user1 -> user2 và user2 -> user1)
            Query query1 = friendsRef
                    .whereEqualTo("userId1", user1)
                    .whereEqualTo("userId2", user2);

            Query query2 = friendsRef
                    .whereEqualTo("userId1", user2)
                    .whereEqualTo("userId2", user1);

            // Thực hiện truy vấn thứ nhất
            List<QueryDocumentSnapshot> documents1 = query1.get().get().getDocuments();
            if (!documents1.isEmpty()) {
                return ResponseEntity.ok(Map.of("status", "accepted"));
            }

            // Thực hiện truy vấn thứ hai
            List<QueryDocumentSnapshot> documents2 = query2.get().get().getDocuments();
            if (!documents2.isEmpty()) {
                return ResponseEntity.ok(Map.of("status", "accepted"));
            }

            // Kiểm tra xem có lời mời đang chờ không
            CollectionReference requestsRef = firestore.collection("friendRequests");

            // Kiểm tra lời mời từ user1 -> user2
            Query requestQuery1 = requestsRef
                    .whereEqualTo("fromUserId", user1)
                    .whereEqualTo("toUserId", user2)
                    .whereEqualTo("status", "pending");

            List<QueryDocumentSnapshot> requestDocs1 = requestQuery1.get().get().getDocuments();
            if (!requestDocs1.isEmpty()) {
                return ResponseEntity.ok(Map.of("status", "pending"));
            }

            // Kiểm tra lời mời từ user2 -> user1
            Query requestQuery2 = requestsRef
                    .whereEqualTo("fromUserId", user2)
                    .whereEqualTo("toUserId", user1)
                    .whereEqualTo("status", "pending");

            List<QueryDocumentSnapshot> requestDocs2 = requestQuery2.get().get().getDocuments();
            if (!requestDocs2.isEmpty()) {
                return ResponseEntity.ok(Map.of("status", "pending"));
            }

            // Không có mối quan hệ nào
            return ResponseEntity.ok(Map.of("status", "none"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi kiểm tra trạng thái: " + e.getMessage()));
        }
    }

    @GetMapping("/list/{userId}")
    public ResponseEntity<?> getFriendList(@PathVariable String userId) {
        Firestore firestore = FirestoreSingleton.getFirestore();

        try {
            // Lấy danh sách bạn bè từ collection friends
            CollectionReference friendsRef = firestore.collection("friends");

            // Tìm các bản ghi mà userId là userId1 hoặc userId2
            Query query1 = friendsRef.whereEqualTo("userId1", userId);
            Query query2 = friendsRef.whereEqualTo("userId2", userId);

            // Thực hiện truy vấn
            List<QueryDocumentSnapshot> friends1 = query1.get().get().getDocuments();
            List<QueryDocumentSnapshot> friends2 = query2.get().get().getDocuments();

            // Tạo set để lưu ID của bạn bè
            Set<String> friendIds = new HashSet<>();

            // Xử lý kết quả từ query1
            for (QueryDocumentSnapshot doc : friends1) {
                String friendId = doc.getString("userId2");
                friendIds.add(friendId);
            }

            // Xử lý kết quả từ query2
            for (QueryDocumentSnapshot doc : friends2) {
                String friendId = doc.getString("userId1");
                friendIds.add(friendId);
            }

            // Lấy thông tin chi tiết của từng người bạn
            List<Map<String, Object>> friendList = new ArrayList<>();
            CollectionReference usersRef = firestore.collection("users");

            for (String friendId : friendIds) {
                DocumentSnapshot userDoc = usersRef.document(friendId).get().get();
                if (userDoc.exists()) {
                    Map<String, Object> userData = userDoc.getData();
                    userData.put("id", userDoc.getId());
                    friendList.add(userData);
                }
            }

            return ResponseEntity.ok(friendList);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy danh sách bạn bè: " + e.getMessage()));
        }
    }
    // Thêm các endpoints mới

    @GetMapping("/requests/{userId}")
    public ResponseEntity<?> getFriendRequests(@PathVariable String userId) {
        Firestore firestore = FirestoreSingleton.getFirestore();

        try {
            // Lấy các lời mời kết bạn đến userId
            CollectionReference requestsRef = firestore.collection("friendRequests");
            Query query = requestsRef
                    .whereEqualTo("toUserId", userId)
                    .whereEqualTo("status", "pending");

            List<QueryDocumentSnapshot> requestDocs = query.get().get().getDocuments();
            List<Map<String, Object>> requests = new ArrayList<>();

            // Lấy thông tin người gửi lời mời
            for (QueryDocumentSnapshot doc : requestDocs) {
                String fromUserId = doc.getString("fromUserId");
                DocumentSnapshot fromUserDoc = firestore.collection("users").document(fromUserId).get().get();

                if (fromUserDoc.exists()) {
                    Map<String, Object> requestData = new HashMap<>(doc.getData());
                    requestData.put("id", doc.getId());

                    // Thêm thông tin người gửi
                    Map<String, Object> fromUserInfo = new HashMap<>();
                    fromUserInfo.put("id", fromUserId);
                    fromUserInfo.put("firstName", fromUserDoc.getString("firstName"));
                    fromUserInfo.put("lastName", fromUserDoc.getString("lastName"));
                    fromUserInfo.put("email", fromUserDoc.getString("email"));
                    fromUserInfo.put("avatarUrl", fromUserDoc.getString("avatarUrl"));

                    requestData.put("fromUser", fromUserInfo);
                    requests.add(requestData);
                }
            }

            return ResponseEntity.ok(requests);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy danh sách lời mời kết bạn: " + e.getMessage()));
        }
    }

    @PostMapping("/accept/{requestId}")
    public ResponseEntity<?> acceptFriendRequest(@PathVariable String requestId) {
        Firestore firestore = FirestoreSingleton.getFirestore();

        try {
            // Lấy thông tin lời mời kết bạn
            DocumentReference requestRef = firestore.collection("friendRequests").document(requestId);
            DocumentSnapshot requestDoc = requestRef.get().get();

            if (!requestDoc.exists()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy lời mời kết bạn"));
            }

            String fromUserId = requestDoc.getString("fromUserId");
            String toUserId = requestDoc.getString("toUserId");

            // Cập nhật trạng thái lời mời
            requestRef.update("status", "accepted");

            // Tạo mối quan hệ bạn bè mới
            Map<String, Object> friendshipData = new HashMap<>();
            friendshipData.put("userId1", fromUserId);
            friendshipData.put("userId2", toUserId);
            friendshipData.put("createdAt", FieldValue.serverTimestamp());

            DocumentReference newFriendshipRef = firestore.collection("friends").document();
            newFriendshipRef.set(friendshipData);

            return ResponseEntity.ok(Map.of("message", "Đã chấp nhận lời mời kết bạn"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi chấp nhận lời mời kết bạn: " + e.getMessage()));
        }
    }

    @PostMapping("/reject/{requestId}")
    public ResponseEntity<?> rejectFriendRequest(@PathVariable String requestId) {
        Firestore firestore = FirestoreSingleton.getFirestore();

        try {
            // Lấy thông tin lời mời kết bạn
            DocumentReference requestRef = firestore.collection("friendRequests").document(requestId);
            DocumentSnapshot requestDoc = requestRef.get().get();

            if (!requestDoc.exists()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy lời mời kết bạn"));
            }

            // Cập nhật trạng thái lời mời hoặc xóa
            requestRef.update("status", "rejected");

            return ResponseEntity.ok(Map.of("message", "Đã từ chối lời mời kết bạn"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi từ chối lời mời kết bạn: " + e.getMessage()));
        }
    }
}