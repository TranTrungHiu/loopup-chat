package com.loopupchat.auth.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.UserRecord.UpdateRequest;
import com.google.firebase.cloud.FirestoreClient;
import com.loopupchat.auth.service.JwtService;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*") // Enable CORS for development
public class UserController {

    private final FirebaseAuth firebaseAuth;
    private final Firestore firestore;

    @Autowired
    private JwtService jwtService;

    public UserController(FirebaseAuth firebaseAuth) throws IOException {
        this.firebaseAuth = firebaseAuth;
        this.firestore = FirestoreClient.getFirestore();
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Thiếu token"));
            }

            String token = authHeader.substring(7);
            // First try to validate as JWT
            String uid;
            try {
                uid = jwtService.validateTokenAndGetUid(token);
            } catch (Exception e) {
                // If not a valid JWT, try as Firebase token
                FirebaseToken decodedToken = firebaseAuth.verifyIdToken(token);
                uid = decodedToken.getUid();
            }

            // Get user info from Firestore
            DocumentSnapshot snapshot = firestore.collection("users").document(uid).get().get();
            if (!snapshot.exists()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy người dùng"));
            }

            return ResponseEntity.ok(snapshot.getData());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy thông tin người dùng: " + e.getMessage()));
        }
    }

    @GetMapping("/{uid}")
    public ResponseEntity<?> getUserById(@PathVariable String uid) {
        try {
            // Get user info from Firestore
            DocumentSnapshot snapshot = firestore.collection("users").document(uid).get().get();
            if (!snapshot.exists()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy người dùng"));
            }

            // Remove sensitive information before returning
            Map<String, Object> userData = new HashMap<>(snapshot.getData());
            userData.remove("password"); // Remove password if stored

            return ResponseEntity.ok(userData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy thông tin người dùng: " + e.getMessage()));
        }
    }

    @PutMapping("/update-profile")
    public ResponseEntity<?> updateUserProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> updateData) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Thiếu token"));
            }

            String token = authHeader.substring(7);
            // Get uid from token
            String uid;
            try {
                uid = jwtService.validateTokenAndGetUid(token);
            } catch (Exception e) {
                // If not a valid JWT, try as Firebase token
                FirebaseToken decodedToken = firebaseAuth.verifyIdToken(token);
                uid = decodedToken.getUid();
            }

            // Remove fields that shouldn't be updated directly
            updateData.remove("uid");
            updateData.remove("email");
            updateData.remove("verified");
            updateData.remove("password");

            // Update in Firestore
            firestore.collection("users").document(uid).update(updateData);

            // Update displayName in Firebase if firstName or lastName was updated
            if (updateData.containsKey("firstName") || updateData.containsKey("lastName")) {
                // Get current user data
                DocumentSnapshot snapshot = firestore.collection("users").document(uid).get().get();
                String firstName = (String) (updateData.containsKey("firstName") ?
                        updateData.get("firstName") : snapshot.get("firstName"));
                String lastName = (String) (updateData.containsKey("lastName") ?
                        updateData.get("lastName") : snapshot.get("lastName"));

                // Update displayName in Firebase Auth
                UpdateRequest request = new UpdateRequest(uid)
                        .setDisplayName(firstName + " " + lastName);
                firebaseAuth.updateUser(request);
            }

            return ResponseEntity.ok(Map.of("message", "Cập nhật thông tin thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi cập nhật thông tin: " + e.getMessage()));
        }
    }
}