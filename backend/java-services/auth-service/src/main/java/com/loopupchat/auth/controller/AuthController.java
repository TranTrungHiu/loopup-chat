package com.loopupchat.auth.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

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
import com.loopupchat.auth.dto.OtpRequest;
import com.loopupchat.auth.dto.SignUpRequest;
import com.loopupchat.auth.dto.VerifyOtpRequest;
import com.loopupchat.auth.dto.UpdateVerificationRequest;
import com.loopupchat.auth.service.JwtService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Enable CORS for development
public class AuthController {
    private final FirebaseAuth firebaseAuth;
    private final Firestore firestore;

    // Map to store OTP info: email -> {otp, expiry}
    private static final ConcurrentHashMap<String, Map<String, Object>> otpStorage = new ConcurrentHashMap<>();

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private JwtService jwtService;

    public AuthController(FirebaseAuth firebaseAuth) {
        this.firebaseAuth = firebaseAuth;
        this.firestore = FirestoreClient.getFirestore();
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignUpRequest request) {
        try {
            // Check if email already exists
            try {
                UserRecord existingUser = firebaseAuth.getUserByEmail(request.getEmail());
                if (existingUser != null) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("message", "Email đã được đăng ký"));
                }
            } catch (FirebaseAuthException e) {
                // Email doesn't exist, continue with registration
            }

            CreateRequest createRequest = new CreateRequest()
                    .setEmail(request.getEmail())
                    .setPassword(request.getPassword())
                    .setDisplayName(request.getFirstName() + " " + request.getLastName())
                    .setEmailVerified(false); // Require email verification via OTP

            UserRecord userRecord = firebaseAuth.createUser(createRequest);

            // Save additional info to Firestore
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("uid", userRecord.getUid());
            userInfo.put("email", request.getEmail());
            userInfo.put("firstName", request.getFirstName());
            userInfo.put("lastName", request.getLastName());
            userInfo.put("gender", request.getGender());
            userInfo.put("avatarUrl", request.getAvatarUrl());
            userInfo.put("verified", false);
            userInfo.put("createdAt", System.currentTimeMillis());

            firestore.collection("users").document(userRecord.getUid()).set(userInfo);

            // Generate and send OTP
            String otp = generateOTP();
            sendOtpEmail(request.getEmail(), otp, request.getFirstName());

            return ResponseEntity.ok(Map.of(
                    "message", "Đăng ký thành công! Vui lòng kiểm tra email để nhận mã OTP.",
                    "uid", userRecord.getUid()
            ));
        } catch (FirebaseAuthException e) {
            String errorMessage = "Lỗi: " + e.getMessage();
            if (e.getErrorCode().equals("email-already-exists")) {
                errorMessage = "Email này đã được sử dụng bởi tài khoản khác";
            }
            return ResponseEntity.badRequest().body(Map.of("message", errorMessage));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // Verify the Firebase ID token
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(request.getIdToken());

            // If valid
            String uid = decodedToken.getUid();
            String email = decodedToken.getEmail();

            // Check if user has verified their email
            DocumentReference docRef = firestore.collection("users").document(uid);
            DocumentSnapshot snapshot = docRef.get().get();

            if (snapshot.exists()) {
                Boolean verified = snapshot.getBoolean("verified");
                if (verified != null && !verified) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of(
                                    "message", "Tài khoản chưa được xác thực. Vui lòng xác thực email.",
                                    "verified", false,
                                    "uid", uid,
                                    "email", email
                            ));
                }

                // Generate JWT token
                String token = jwtService.generateToken(uid);

                // Return login info
                return ResponseEntity.ok(Map.of(
                        "message", "Đăng nhập thành công",
                        "uid", uid,
                        "email", email,
                        "verified", true,
                        "token", token,
                        "user", snapshot.getData()));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy thông tin người dùng"));
            }

        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "message", "Đăng nhập thất bại: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Lỗi hệ thống: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody OtpRequest request) {
        try {
            // Check if email exists in Firebase
            UserRecord userRecord = firebaseAuth.getUserByEmail(request.getEmail());

            // Generate and send OTP
            String otp = generateOTP();
            sendOtpEmail(request.getEmail(), otp, userRecord.getDisplayName());

            return ResponseEntity.ok(Map.of(
                    "message", "Mã OTP đã được gửi đến email của bạn.",
                    "uid", userRecord.getUid()));
        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy tài khoản với email này"));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        // Check if OTP is valid
        if (isValidOTP(request.getEmail(), request.getOtp())) {
            try {
                // Get user info from email
                UserRecord userRecord = firebaseAuth.getUserByEmail(request.getEmail());

                // Update email verification status in Firebase Auth
                UserRecord.UpdateRequest updateRequest = new UserRecord.UpdateRequest(userRecord.getUid())
                        .setEmailVerified(true);
                firebaseAuth.updateUser(updateRequest);

                // Update verification status in Firestore
                DocumentReference docRef = firestore.collection("users").document(userRecord.getUid());
                docRef.update("verified", true);

                // Generate JWT token
                String token = jwtService.generateToken(userRecord.getUid());

                return ResponseEntity.ok(Map.of(
                        "message", "Xác thực thành công!",
                        "uid", userRecord.getUid(),
                        "token", token
                ));
            } catch (FirebaseAuthException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Lỗi khi xác thực: " + e.getMessage()));
            }
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Mã OTP không hợp lệ hoặc đã hết hạn."));
        }
    }

    @GetMapping("/user-info")
    public ResponseEntity<?> getUserInfo(@RequestHeader(value = "Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Thiếu token"));
            }

            String token = authHeader.substring(7);
            String uid = null;

            try {
                // First try to validate as a JWT token
                uid = jwtService.validateTokenAndGetUid(token);
            } catch (Exception e) {
                // If JWT validation fails, try as Firebase token
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

    @PostMapping("/update-verification")
    public ResponseEntity<?> updateVerification(@RequestBody UpdateVerificationRequest request) {
        try {
            // Update verification status in Firestore
            DocumentReference docRef = firestore.collection("users").document(request.getUid());
            docRef.update("verified", request.isVerified());

            // Update email verification status in Firebase Auth
            UserRecord.UpdateRequest updateRequest = new UserRecord.UpdateRequest(request.getUid())
                    .setEmailVerified(request.isVerified());
            firebaseAuth.updateUser(updateRequest);

            return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái xác thực thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi cập nhật trạng thái xác thực: " + e.getMessage()));
        }
    }

    // Generate random 6-digit OTP
    private String generateOTP() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    // Save OTP and expiry time (15 minutes)
    private void storeOTP(String email, String otp) {
        Map<String, Object> otpInfo = new HashMap<>();
        otpInfo.put("otp", otp);
        otpInfo.put("expiry", System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(15));

        otpStorage.put(email, otpInfo);
    }

    // Validate OTP
    private boolean isValidOTP(String email, String otp) {
        Map<String, Object> otpInfo = otpStorage.get(email);
        if (otpInfo == null) {
            return false;
        }

        String storedOTP = (String) otpInfo.get("otp");
        long expiry = (long) otpInfo.get("expiry");

        if (storedOTP.equals(otp) && System.currentTimeMillis() < expiry) {
            // Remove OTP after successful verification
            otpStorage.remove(email);
            return true;
        }

        return false;
    }

    // Send email with OTP code
    private void sendOtpEmail(String to, String otp, String firstName) {
        // Store OTP in memory
        storeOTP(to, otp);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Mã xác thực tài khoản Loopup");

            String content = "Xin chào " + (firstName != null ? firstName : "") + ",\n\n"
                    + "Cảm ơn bạn đã đăng ký tài khoản Loopup.\n\n"
                    + "Mã xác thực của bạn là: " + otp + "\n\n"
                    + "Mã này sẽ hết hạn sau 15 phút.\n\n"
                    + "Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.\n\n"
                    + "Trân trọng,\n"
                    + "Đội ngũ Loopup";

            message.setText(content);

            mailSender.send(message);
            System.out.println("OTP email sent to: " + to); // Add logging
        } catch (Exception e) {
            System.err.println("Lỗi gửi email: " + e.getMessage());
            // Still store OTP for testing without sending actual email
        }
    }
}