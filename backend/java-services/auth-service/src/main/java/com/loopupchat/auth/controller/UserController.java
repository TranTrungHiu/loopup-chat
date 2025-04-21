package com.loopupchat.auth.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.cloud.FirestoreClient;

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
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Thiếu token");
            }

            String idToken = authHeader.substring(7);
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
            String uid = decodedToken.getUid();

            // Lấy thông tin từ Firestore
            DocumentSnapshot snapshot = firestore.collection("users").document(uid).get().get();
            if (!snapshot.exists()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
            }

            return ResponseEntity.ok(snapshot.getData());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi lấy thông tin người dùng: " + e.getMessage());
        }
    }

    @GetMapping("/find")
    public ResponseEntity<?> findUserByEmail(@RequestParam String email) {
        try {
            ApiFuture<QuerySnapshot> future = firestore.collection("users")
                    .whereEqualTo("email", email)
                    .get();

            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            if (documents.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
            }

            DocumentSnapshot userDoc = documents.get(0);
            Map<String, Object> userData = userDoc.getData();
            userData.put("uid", userDoc.getId()); // trả luôn id để client dùng check friendship
            System.out.println("Email tìm kiếm: " + email);
            return ResponseEntity.ok(userData);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tìm người dùng: " + e.getMessage());
        }
    }


}
