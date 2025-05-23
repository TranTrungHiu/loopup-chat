package com.loopupchat.auth.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.UserRecord.CreateRequest;
import com.google.firebase.cloud.FirestoreClient;
import com.loopupchat.auth.dto.LoginRequest;
import com.loopupchat.auth.dto.SignUpRequest;

import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;

import java.net.URL;
import java.util.Date;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final FirebaseAuth firebaseAuth;

    public AuthController(FirebaseAuth firebaseAuth) {
        this.firebaseAuth = firebaseAuth;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignUpRequest request) {
        try {
            CreateRequest createRequest = new CreateRequest()
                    .setEmail(request.getEmail())
                    .setPassword(request.getPassword());

            UserRecord userRecord = firebaseAuth.createUser(createRequest);

            // Lưu thêm thông tin vào Firestore
            Firestore firestore = FirestoreClient.getFirestore();
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("uid", userRecord.getUid());
            userInfo.put("email", request.getEmail());
            userInfo.put("firstName", request.getFirstName());
            userInfo.put("lastName", request.getLastName());
            userInfo.put("gender", request.getGender());
            userInfo.put("avatarUrl", request.getAvatarUrl()); // Tạm thời avatar là URL hoặc null

            firestore.collection("users").document(userRecord.getUid()).set(userInfo);

            firebaseAuth.generateEmailVerificationLink(request.getEmail());

            return ResponseEntity.ok(Map.of("message", "Đăng ký thành công!"));
        } catch (FirebaseAuthException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // Firebase không hỗ trợ đăng nhập bằng email+password từ backend,
            // nên phần này cần xử lý từ frontend (React/React Native) để nhận ID token,
            // rồi gửi ID token lên backend xác thực.

            // Kiểm tra token đã gửi
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(request.getIdToken());

            // Nếu hợp lệ
            String uid = decodedToken.getUid();
            String email = decodedToken.getEmail();

            // Trả về thông tin hoặc JWT (nếu bạn sử dụng riêng)
            return ResponseEntity.ok(Map.of(
                    "message", "Đăng nhập thành công",
                    "uid", uid,
                    "email", email));

        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Đăng nhập thất bại: " + e.getMessage());
        }
    }

    @GetMapping("/user/{uid}")
    public ResponseEntity<?> getUserInfo(@PathVariable String uid) {
        DocumentReference docRef = FirestoreClient.getFirestore()
                .collection("users")
                .document(uid);
        ApiFuture<DocumentSnapshot> future = docRef.get();

        try {
            DocumentSnapshot snapshot = future.get();
            if (snapshot.exists()) {
                return ResponseEntity.ok(snapshot.getData());
            } else {

                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Người dùng không tồn tại"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi lấy dữ liệu: " + e.getMessage()));
        }
    }
}

@RestController
@RequestMapping("/api/s3")
class S3Controller {

    private final AmazonS3 s3Client;
    private final String bucketName;

    public S3Controller(
            @Value("${aws.access-key}") String accessKey,
            @Value("${aws.secret-key}") String secretKey,
            @Value("${aws.region}") String region,
            @Value("${aws.bucket-name}") String bucketName) {

        System.out.println("AWS Region: " + region);
        System.out.println("AWS Bucket Name: " + bucketName);

        this.bucketName = bucketName;

        // Configure S3 client using credentials from application.properties
        this.s3Client = AmazonS3ClientBuilder.standard()
                .withCredentials(new com.amazonaws.auth.AWSStaticCredentialsProvider(
                        new com.amazonaws.auth.BasicAWSCredentials(accessKey, secretKey)))
                .withRegion(region)
                .build();
    }

    @GetMapping("/generate-presigned-url")
    public Map<String, String> generatePresignedUrl(@RequestParam String fileName) {
        Date expiration = new Date();
        long expTimeMillis = expiration.getTime();
        expTimeMillis += 1000 * 60 * 15; // 15 minutes
        expiration.setTime(expTimeMillis);

        GeneratePresignedUrlRequest generatePresignedUrlRequest = new GeneratePresignedUrlRequest(bucketName, fileName)
                .withMethod(HttpMethod.PUT)
                .withExpiration(expiration);
        URL url = s3Client.generatePresignedUrl(generatePresignedUrlRequest);

        System.out.println("Signed URL: " + url.toString());

        return Map.of("url", url.toString());
    }
}
