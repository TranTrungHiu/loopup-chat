package com.loopupchat.auth.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.cloud.FirestoreClient;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final FirebaseAuth firebaseAuth;
    private final Firestore firestore;

    public UserController(FirebaseAuth firebaseAuth) throws IOException {
        this.firebaseAuth = firebaseAuth;
        this.firestore = FirestoreClient.getFirestore();
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            System.out.println("Received Authorization: " + authHeader); // Log để kiểm tra

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Thiếu token");
            }

            String idToken = authHeader.substring(7);
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
            String uid = decodedToken.getUid();

            System.out.println("Decoded UID: " + uid); // Log UID

            // Lấy thông tin từ Firestore
            DocumentSnapshot snapshot = firestore.collection("users").document(uid).get().get();
            if (!snapshot.exists()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
            }

            System.out.println("Firestore Document: " + snapshot.getData()); // Log dữ liệu Firestore

            return ResponseEntity.ok(snapshot.getData());

        } catch (Exception e) {
            e.printStackTrace(); // Log lỗi chi tiết
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi lấy thông tin người dùng: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            System.out.println("Received request for all users"); // Log kiểm tra
            CollectionReference usersRef = firestore.collection("users");

            List<Map<String, Object>> users = new ArrayList<>();
            for (DocumentSnapshot doc : usersRef.get().get().getDocuments()) {
                users.add(doc.getData());
            }

            return ResponseEntity.ok(users);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi lấy danh sách người dùng: " + e.getMessage());
        }
    }

    @GetMapping("/find")
    public ResponseEntity<?> searchUserByEmail(@RequestParam String email) {
        try {
            CollectionReference usersRef = firestore.collection("users");
            Query query = usersRef.whereEqualTo("email", email);
            ApiFuture<QuerySnapshot> querySnapshot = query.get();
            List<QueryDocumentSnapshot> documents = querySnapshot.get().getDocuments();

            if (documents.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy người dùng với email này"));
            }

            DocumentSnapshot userDoc = documents.get(0);
            Map<String, Object> userData = new HashMap<>(userDoc.getData());

            // Đảm bảo không null và định dạng đúng
            userData.put("id", userDoc.getId());

            return ResponseEntity.ok(userData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi tìm kiếm người dùng: " + e.getMessage()));
        }
    }

    @GetMapping("/{uid}")
    public ResponseEntity<?> getUserByUid(@PathVariable String uid) {
        try {
            DocumentReference userRef = firestore.collection("users").document(uid);
            DocumentSnapshot snapshot = userRef.get().get();

            if (snapshot.exists()) {
                return ResponseEntity.ok(snapshot.getData());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Người dùng không tồn tại"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy thông tin người dùng: " + e.getMessage()));
        }
    }
}
//