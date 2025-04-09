package com.loopupchat.auth.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.UserRecord.CreateRequest;
import com.loopupchat.auth.dto.LoginRequest;
import com.loopupchat.auth.dto.SignUpRequest;

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

            UserRecord userRecord = FirebaseAuth.getInstance().createUser(createRequest);

            FirebaseAuth.getInstance().generateEmailVerificationLink(request.getEmail());

            return ResponseEntity.ok(Map.of("message", "Tạo tài khoản thành công! Vui lòng kiểm tra email."));
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
                "email", email
            ));

        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Đăng nhập thất bại: " + e.getMessage());
        }
    }
}
