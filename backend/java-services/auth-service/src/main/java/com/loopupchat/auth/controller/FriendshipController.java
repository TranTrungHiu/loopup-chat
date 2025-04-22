package com.loopupchat.auth.controller;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.loopupchat.auth.model.Friendship;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/friends")
public class FriendshipController {

    private final Firestore db = FirestoreClient.getFirestore();

    // Gửi lời mời kết bạn
    @PostMapping("/request")
    public ResponseEntity<?> sendFriendRequest(@RequestBody Friendship request) throws Exception {
        // Kiểm tra xem đã tồn tại mối quan hệ giữa hai người dùng hay chưa
        ApiFuture<QuerySnapshot> future = db.collection("friendships")
                .whereIn("userId1", Arrays.asList(request.getUserId1(), request.getUserId2()))
                .whereIn("userId2", Arrays.asList(request.getUserId1(), request.getUserId2()))
                .get();

        List<QueryDocumentSnapshot> docs = future.get().getDocuments();

        if (!docs.isEmpty()) {
            Friendship existingFriendship = docs.get(0).toObject(Friendship.class);

            // Nếu đã tồn tại lời mời kết bạn đang chờ xử lý
            if ("pending".equals(existingFriendship.getStatus())) {
                return ResponseEntity.status(400).body("Lời mời kết bạn đã được gửi trước đó.");
            }

            // Nếu đã là bạn bè
            if ("accepted".equals(existingFriendship.getStatus())) {
                return ResponseEntity.status(400).body("Hai người đã là bạn bè.");
            }
        }

        // Nếu chưa tồn tại, tạo mới lời mời kết bạn
        request.setId(UUID.randomUUID().toString());
        request.setStatus("pending");
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        db.collection("friendships").document(request.getId()).set(request);

        return ResponseEntity.ok("Lời mời kết bạn đã được gửi.");
    }

    // Chấp nhận lời mời
    @PostMapping("/accept")
    public ResponseEntity<?> acceptRequest(@RequestBody Friendship acceptInfo) throws Exception {
        ApiFuture<QuerySnapshot> future = db.collection("friendships")
                .whereEqualTo("userId1", acceptInfo.getUserId1())
                .whereEqualTo("userId2", acceptInfo.getUserId2())
                .get();

        List<QueryDocumentSnapshot> docs = future.get().getDocuments();
        if (!docs.isEmpty()) {
            DocumentReference ref = docs.get(0).getReference();
            Map<String, Object> updates = new HashMap<>();
            updates.put("status", "accepted");
            updates.put("updatedAt", LocalDateTime.now());
            ref.update(updates);
        }

        return ResponseEntity.ok("Accepted");
    }

    // ✅ Kiểm tra trạng thái mối quan hệ
    @GetMapping("/status")
    public ResponseEntity<String> getFriendshipStatus(
            @RequestParam String userId1,
            @RequestParam String userId2) throws ExecutionException, InterruptedException {

        ApiFuture<QuerySnapshot> future = db.collection("friendships")
                .whereIn("userId1", Arrays.asList(userId1, userId2))
                .whereIn("userId2", Arrays.asList(userId1, userId2))
                .get();

        List<QueryDocumentSnapshot> docs = future.get().getDocuments();

        if (docs.isEmpty()) {
            return ResponseEntity.ok("none"); // chưa có quan hệ
        }

        Friendship friendship = docs.get(0).toObject(Friendship.class);
        return ResponseEntity.ok(friendship.getStatus()); // "pending", "accepted", "rejected"
    }

    // ✅ Danh sách bạn bè đã kết bạn
    @GetMapping("/list/{userId}")
    public ResponseEntity<List<Friendship>> getFriends(@PathVariable String userId)
            throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection("friendships")
                .whereEqualTo("status", "accepted")
                .get();

        List<Friendship> friends = new ArrayList<>();
        for (DocumentSnapshot doc : future.get().getDocuments()) {
            Friendship f = doc.toObject(Friendship.class);
            if (f != null && (f.getUserId1().equals(userId) || f.getUserId2().equals(userId))) {
                friends.add(f);
            }
        }

        return ResponseEntity.ok(friends);
    }
}
