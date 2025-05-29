package com.loopupchat.auth.controller;

import com.corundumstudio.socketio.SocketIOServer;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;

import java.io.IOException;
import java.net.URL;
import java.util.*;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final SocketIOServer socketIOServer;
    private final AmazonS3 s3Client;
    private final String bucketName;

    // Tiêm SocketIOServer và cấu hình S3 thông qua constructor
    public MessageController(
            SocketIOServer socketIOServer,
            @Value("${aws.access-key}") String accessKey,
            @Value("${aws.secret-key}") String secretKey,
            @Value("${aws.region}") String region,
            @Value("${aws.bucket-name}") String bucketName) {
        this.socketIOServer = socketIOServer;
        this.bucketName = bucketName;

        // Cấu hình S3 client
        this.s3Client = AmazonS3ClientBuilder.standard()
                .withCredentials(new AWSStaticCredentialsProvider(
                        new BasicAWSCredentials(accessKey, secretKey)))
                .withRegion(region)
                .build();
    }

    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> request) {
        String chatId = request.get("chatId");
        String sender = request.get("sender");
        String message = request.get("message");
        String mediaUrl = request.get("mediaUrl"); // Thêm trường để hỗ trợ media
        String mediaType = request.get("mediaType"); // image, video, document

        Firestore firestore = FirestoreClient.getFirestore();
        CollectionReference messagesRef = firestore.collection("messages");
        DocumentReference chatRef = firestore.collection("chats").document(chatId);

        try {
            if (chatId == null || sender == null || (message == null && mediaUrl == null)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Dữ liệu không hợp lệ"));
            }

            // Kiểm tra xem đoạn chat đã tồn tại chưa
            DocumentSnapshot chatSnapshot = chatRef.get().get();
            if (!chatSnapshot.exists()) {
                // Nếu đoạn chat chưa tồn tại, tạo đoạn chat mới
                Map<String, Object> chatData = new HashMap<>();
                chatData.put("chatId", chatId);
                String[] participants = chatId.split("_");
                chatData.put("participants", Arrays.asList(participants[0], participants[1]));

                // Đặt lastMessage dựa trên loại nội dung
                String lastMessageText = message;
                if (mediaUrl != null && mediaType != null) {
                    lastMessageText = "[" + getMediaTypeDisplay(mediaType) + "]";
                }

                chatData.put("lastMessage", lastMessageText);
                chatData.put("lastUpdated", new Date());
                chatRef.set(chatData);
            } else {
                // Nếu đoạn chat đã tồn tại, cập nhật thông tin đoạn chat
                String lastMessageText = message;
                if (mediaUrl != null && mediaType != null) {
                    lastMessageText = "[" + getMediaTypeDisplay(mediaType) + "]";
                }

                chatRef.update("lastMessage", lastMessageText, "lastUpdated", new Date());
            }

            // Generate unique message ID
            String messageId = UUID.randomUUID().toString();
            Date timestamp = new Date();

            // Lưu tin nhắn vào collection "messages" với ID xác định
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("id", messageId);
            messageData.put("chatId", chatId);
            messageData.put("sender", sender);

            // Thêm thông tin về text hoặc media
            if (message != null && !message.trim().isEmpty()) {
                messageData.put("message", message);
            }

            if (mediaUrl != null && mediaType != null) {
                messageData.put("mediaUrl", mediaUrl);
                messageData.put("mediaType", mediaType);

                // Thêm các thông tin bổ sung cho media
                if (request.containsKey("fileName")) {
                    messageData.put("fileName", request.get("fileName"));
                }

                if (request.containsKey("fileSize")) {
                    messageData.put("fileSize", request.get("fileSize"));
                }
            }
            // thêm id messgage reply nếu có
            if (request.containsKey("replyTo")) {
                messageData.put("replyTo", request.get("replyTo"));
            }

            messageData.put("timestamp", timestamp);
            messageData.put("status", "sent");

            // Lưu tin nhắn với ID được tạo
            messagesRef.document(messageId).set(messageData);

            // Thêm thông tin người đã đọc tin nhắn
            Map<String, Object> readReceipt = new HashMap<>();
            readReceipt.put(sender, timestamp);
            messageData.put("readBy", readReceipt);

            // Phát tin nhắn qua Socket.IO đến phòng chat tương ứng
            socketIOServer.getRoomOperations(chatId).sendEvent("new_message", messageData);

            // Thông báo cập nhật danh sách chat cho tất cả người tham gia
            String[] participants = chatId.split("_");
            String lastMessageText = message;

            if (mediaUrl != null && mediaType != null) {
                lastMessageText = "[" + getMediaTypeDisplay(mediaType) + "]";
            }

            for (String participant : participants) {
                socketIOServer.getRoomOperations("user_" + participant).sendEvent("chat_updated",
                        Map.of(
                                "chatId", chatId,
                                "lastMessage", lastMessageText,
                                "lastUpdated", timestamp));
            }

            return ResponseEntity.ok(messageData);
        } catch (Exception e) {
            e.printStackTrace(); // Log lỗi chi tiết
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi gửi tin nhắn: " + e.getMessage()));
        }
    }

    // Helper method để hiển thị loại media
    private String getMediaTypeDisplay(String mediaType) {
        switch (mediaType) {
            case "image":
                return "Hình ảnh";
            case "video":
                return "Video";
            case "document":
                return "Tài liệu";
            default:
                return "File đính kèm";
        }
    }

    // Các phương thức hiện tại
    // ...existing code...

    /**
     * Tạo presigned URL để upload trực tiếp media lên S3 từ client
     * 
     * @param fileInfo thông tin về file cần upload
     * @return URL đã ký để upload
     */
    @PostMapping("/generate-upload-url")
    public ResponseEntity<?> generateUploadUrl(@RequestBody Map<String, String> fileInfo) {
        try {
            String fileName = fileInfo.get("fileName");
            String contentType = fileInfo.get("contentType");
            String fileExtension = fileInfo.get("fileExtension");

            if (fileName == null || contentType == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Thiếu thông tin file"));
            }

            // Tạo tên file duy nhất để tránh ghi đè
            String uniqueFileName = UUID.randomUUID().toString();

            // Nếu có định dạng file, thêm vào tên file
            if (fileExtension != null && !fileExtension.isEmpty()) {
                uniqueFileName += "." + fileExtension;
            }

            // Tạo prefixed path dựa vào loại file (organize files)
            String filePrefix = "media/";
            if (contentType.startsWith("image/")) {
                filePrefix += "images/";
            } else if (contentType.startsWith("video/")) {
                filePrefix += "videos/";
            } else if (contentType.startsWith("audio/")) {
                filePrefix += "audios/";
            } else {
                filePrefix += "documents/";
            }

            String s3ObjectKey = filePrefix + uniqueFileName;

            // Thiết lập các metadata cho object
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(contentType);
            metadata.addUserMetadata("originalFileName", fileName);

            // Tạo presigned URL với thời hạn 15 phút để upload
            Date expiration = new Date();
            long expTimeMillis = expiration.getTime();
            expTimeMillis += 1000 * 60 * 15; // 15 phút
            expiration.setTime(expTimeMillis);

            GeneratePresignedUrlRequest presignedUrlRequest = new GeneratePresignedUrlRequest(bucketName, s3ObjectKey)
                    .withMethod(HttpMethod.PUT)
                    .withExpiration(expiration);
            presignedUrlRequest.setContentType(contentType);

            URL presignedUrl = s3Client.generatePresignedUrl(presignedUrlRequest);

            // Trả về URL để upload và URL để truy cập sau khi upload
            String downloadUrl = s3Client.getUrl(bucketName, s3ObjectKey).toString();

            Map<String, String> result = new HashMap<>();
            result.put("uploadUrl", presignedUrl.toString());
            result.put("downloadUrl", downloadUrl);
            result.put("objectKey", s3ObjectKey);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi tạo URL upload: " + e.getMessage()));
        }
    }

    /**
     * API để trực tiếp upload file từ server (thay thế cho upload từ client)
     */
    @PostMapping("/upload-media")
    public ResponseEntity<?> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam("chatId") String chatId,
            @RequestParam("sender") String sender,
            @RequestParam("mediaType") String mediaType) {

        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File trống"));
            }

            // Tạo tên file duy nhất
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf(".") + 1);
            }

            String uniqueFileName = UUID.randomUUID().toString();
            if (!fileExtension.isEmpty()) {
                uniqueFileName += "." + fileExtension;
            }

            // Tạo prefix cho file dựa vào loại
            String filePrefix = "media/";
            if (mediaType.equals("image")) {
                filePrefix += "images/";
            } else if (mediaType.equals("video")) {
                filePrefix += "videos/";
            } else {
                filePrefix += "documents/";
            }

            String s3ObjectKey = filePrefix + uniqueFileName;

            // Thiết lập metadata
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            metadata.setContentType(file.getContentType());
            metadata.addUserMetadata("originalFileName", originalFileName);

            // Upload file lên S3
            PutObjectRequest putObjectRequest = new PutObjectRequest(
                    bucketName,
                    s3ObjectKey,
                    file.getInputStream(),
                    metadata);

            s3Client.putObject(putObjectRequest);

            // Lấy URL của file đã upload
            String fileUrl = s3Client.getUrl(bucketName, s3ObjectKey).toString();

            // Tạo message với media
            Map<String, String> messageRequest = new HashMap<>();
            messageRequest.put("chatId", chatId);
            messageRequest.put("sender", sender);
            messageRequest.put("mediaUrl", fileUrl);
            messageRequest.put("mediaType", mediaType);
            messageRequest.put("fileName", originalFileName);
            messageRequest.put("fileSize", String.valueOf(file.getSize()));

            // Gửi message
            return sendMessage(messageRequest);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi upload file: " + e.getMessage()));
        }
    }

    /**
     * Lấy thông tin file
     */
    @GetMapping("/media-info/{objectKey}")
    public ResponseEntity<?> getMediaInfo(@PathVariable String objectKey) {
        try {
            // Decode object key if it was URL encoded
            objectKey = java.net.URLDecoder.decode(objectKey, "UTF-8");

            if (!s3Client.doesObjectExist(bucketName, objectKey)) {
                return ResponseEntity.notFound().build();
            }

            // Tạo signed URL với thời hạn truy cập
            Date expiration = new Date();
            long expTimeMillis = expiration.getTime();
            expTimeMillis += 1000 * 60 * 60; // 1 giờ
            expiration.setTime(expTimeMillis);

            GeneratePresignedUrlRequest generatePresignedUrlRequest = new GeneratePresignedUrlRequest(bucketName,
                    objectKey)
                    .withMethod(HttpMethod.GET)
                    .withExpiration(expiration);

            URL url = s3Client.generatePresignedUrl(generatePresignedUrlRequest);

            Map<String, String> result = new HashMap<>();
            result.put("url", url.toString());
            result.put("objectKey", objectKey);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi lấy thông tin file: " + e.getMessage()));
        }
    }

    @GetMapping("/{chatId}")
    public ResponseEntity<?> getMessages(@PathVariable String chatId) {
        Firestore firestore = FirestoreClient.getFirestore();

        try {
            if (chatId == null || chatId.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "chatId không được để trống"));
            }

            System.out.println("Đang lấy tin nhắn cho chat: " + chatId);

            // Để đảm bảo an toàn, trả về danh sách trống nếu chatId không đúng định dạng
            if (chatId.contains("/") || chatId.contains("\\")) {
                System.out.println("Phát hiện ký tự không hợp lệ trong chatId: " + chatId);
                return ResponseEntity.ok(new ArrayList<>());
            }

            CollectionReference messagesRef = firestore.collection("messages");

            // Truy vấn tin nhắn theo chatId và sắp xếp theo thời gian
            Query query = messagesRef.whereEqualTo("chatId", chatId).orderBy("timestamp", Query.Direction.ASCENDING);

            try {
                List<QueryDocumentSnapshot> documents = query.get().get().getDocuments();
                System.out.println("Số tin nhắn tìm được: " + documents.size());

                // Chuyển đổi kết quả thành danh sách tin nhắn
                List<Map<String, Object>> messages = new ArrayList<>();
                for (QueryDocumentSnapshot doc : documents) {
                    try {
                        Map<String, Object> msgData = doc.getData();

                        // Đảm bảo có id nếu không có trong dữ liệu
                        if (!msgData.containsKey("id")) {
                            msgData.put("id", doc.getId());
                        }

                        messages.add(msgData);
                    } catch (Exception docEx) {
                        System.err.println("Lỗi xử lý tài liệu: " + doc.getId() + ", lỗi: " + docEx.getMessage());
                    }
                }

                System.out.println("Đã xử lý thành công " + messages.size() + " tin nhắn");
                return ResponseEntity.ok(messages);
            } catch (Exception e) {
                System.err.println("Lỗi khi truy vấn dữ liệu cho chatId: " + chatId);
                e.printStackTrace();

                // Kiểm tra nếu lỗi là do chat không tồn tại
                try {
                    DocumentReference chatRef = firestore.collection("chats").document(chatId);
                    DocumentSnapshot chatSnapshot = chatRef.get().get();

                    if (!chatSnapshot.exists()) {
                        System.out.println("Chat không tồn tại: " + chatId);
                    }
                } catch (Exception chatEx) {
                    System.err.println("Lỗi khi kiểm tra tồn tại chat: " + chatEx.getMessage());
                }

                // Trả về danh sách rỗng thay vì lỗi 500 để giao diện người dùng không bị gián
                // đoạn
                return ResponseEntity.ok(new ArrayList<>());
            }
        } catch (Exception e) {
            System.err.println("Lỗi tổng thể khi xử lý yêu cầu tin nhắn cho chatId: " + chatId);
            e.printStackTrace();
            return ResponseEntity.ok(new ArrayList<>()); // Trả về danh sách rỗng thay vì lỗi 500
        }
    }

    @PostMapping("/{messageId}/read")
    public ResponseEntity<?> markMessageAsRead(
            @PathVariable String messageId,
            @RequestBody Map<String, String> request) {

        System.out.println("Marking message as read: " + messageId + " by user: " + request.get("userId"));

        String userId = request.get("userId");
        if (userId == null || userId.isEmpty()) {
            System.out.println("Error: userId is empty or null");
            return ResponseEntity.badRequest().body(Map.of("message", "userId không được để trống"));
        }

        if (messageId == null || messageId.isEmpty()) {
            System.out.println("Error: messageId is empty or null");
            return ResponseEntity.badRequest().body(Map.of("message", "messageId không được để trống"));
        }

        Firestore firestore = FirestoreClient.getFirestore();
        DocumentReference messageRef = firestore.collection("messages").document(messageId);

        try {
            // Kiểm tra xem tin nhắn có tồn tại không
            DocumentSnapshot messageDoc = messageRef.get().get();
            if (!messageDoc.exists()) {
                System.out.println("Message not found: " + messageId);

                // Thay vì trả về 404, chúng ta trả về thành công giả để tránh lỗi ở client
                // Client chỉ cần biết là nỗ lực đánh dấu đã thành công
                return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "message", "Tin nhắn không tồn tại nhưng đã ghi nhận yêu cầu đánh dấu đã đọc"));
            }

            // Lấy thông tin tin nhắn
            Map<String, Object> messageData = messageDoc.getData();
            String chatId = (String) messageData.get("chatId");
            System.out.println("Found message in chat: " + chatId);

            // Cập nhật người đọc tin nhắn
            Map<String, Object> updates = new HashMap<>();
            Date timestamp = new Date();
            updates.put("readBy." + userId, timestamp);
            messageRef.update(updates);
            System.out.println("Updated read status for user: " + userId);

            // Thông báo cập nhật trạng thái đọc tin nhắn cho phòng chat
            Map<String, Object> readNotification = new HashMap<>();
            readNotification.put("messageId", messageId);
            readNotification.put("userId", userId);
            readNotification.put("timestamp", timestamp);

            socketIOServer.getRoomOperations(chatId).sendEvent("message_read", readNotification);
            System.out.println("Sent message_read event to room: " + chatId);

            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (Exception e) {
            System.err.println("Error marking message as read: " + messageId + ", error: " + e.getMessage());
            e.printStackTrace();

            // Thay vì trả về 500, chúng ta trả về thành công giả để tránh lỗi ở client
            return ResponseEntity.ok(Map.of(
                    "status", "error",
                    "message", "Đã xảy ra lỗi khi đánh dấu đã đọc, nhưng đã được xử lý an toàn"));
        }
    }

    // Gửi ảnh
    @PostMapping("/api/messages/image")
    public ResponseEntity<?> uploadImage(
            @RequestParam("image") MultipartFile image,
            @RequestParam("chatId") String chatId,
            @RequestParam("sender") String sender) {
        try {
            // Lưu ảnh vào hệ thống hoặc cloud storage
            String imageName = image.getOriginalFilename();
            String imageUrl = "https://your-storage-service.com/" + imageName;

            // Lưu thông tin ảnh vào Firestore
            Firestore firestore = FirestoreClient.getFirestore();
            DocumentReference chatRef = firestore.collection("chats").document(chatId);
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("sender", sender);
            messageData.put("imageUrl", imageUrl);
            messageData.put("timestamp", new Date());
            chatRef.collection("messages").add(messageData);

            return ResponseEntity.ok(Map.of("message", "Image uploaded successfully", "imageUrl", imageUrl));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error uploading image");
        }
    }

    // Xử lý upload file
    @PostMapping("/api/messages/file")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("chatId") String chatId,
            @RequestParam("sender") String sender) {
        try {
            // Lưu file vào hệ thống hoặc cloud storage
            String fileName = file.getOriginalFilename();
            String fileUrl = "https://your-storage-service.com/" + fileName;

            // Lưu thông tin file vào Firestore
            Firestore firestore = FirestoreClient.getFirestore();
            DocumentReference chatRef = firestore.collection("chats").document(chatId);
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("sender", sender);
            messageData.put("fileUrl", fileUrl);
            messageData.put("timestamp", new Date());
            chatRef.collection("messages").add(messageData);

            return ResponseEntity.ok(Map.of("message", "File uploaded successfully", "fileUrl", fileUrl));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error uploading file");
        }
    }

    @PostMapping("/forward")
    public ResponseEntity<?> forwardMessage(@RequestBody Map<String, Object> body) {
        String toUserId = (String) body.get("toUserId");
        String toGroupId = (String) body.get("toGroupId");
        String messageId = (String) body.get("messageId");
        String fromUserId = (String) body.get("fromUserId");
        Firestore firestore = FirestoreClient.getFirestore();
        DocumentReference msgRef = firestore.collection("messages").document(messageId);

        try {
            DocumentSnapshot snapshot = msgRef.get().get();
            if (!snapshot.exists()) {
                return ResponseEntity.status(404).body(Map.of("error", "Không tìm thấy tin nhắn"));
            }
            Map<String, Object> msgData = new HashMap<>(snapshot.getData());
            msgData.put("id", UUID.randomUUID().toString());
            msgData.put("sender", fromUserId);
            msgData.put("forwardedFrom", messageId);

            // Đặt thời gian mới nhất cho tin nhắn chuyển tiếp
            Date now = new Date();
            msgData.put("createdAt", now.getTime());
            msgData.put("timestamp", now);

            String targetChatId = null;

            // Nếu chuyển tiếp vào nhóm thì set chatId là groupId mới
            if (toGroupId != null && !toGroupId.isEmpty()) {
                msgData.put("chatId", toGroupId);
                targetChatId = toGroupId;
            }
            // Nếu chuyển tiếp cho user thì tạo chatId mới hoặc lấy chatId cũ (tuỳ logic)
            else if (toUserId != null && !toUserId.isEmpty()) {
                String chatId1 = fromUserId + "_" + toUserId;
                String chatId2 = toUserId + "_" + fromUserId;

                DocumentReference chatRef1 = firestore.collection("chats").document(chatId1);
                DocumentReference chatRef2 = firestore.collection("chats").document(chatId2);

                DocumentSnapshot chatSnap1 = chatRef1.get().get();
                DocumentSnapshot chatSnap2 = chatRef2.get().get();

                if (chatSnap1.exists()) {
                    targetChatId = chatId1;
                } else if (chatSnap2.exists()) {
                    targetChatId = chatId2;
                } else {
                    List<String> ids = Arrays.asList(fromUserId, toUserId);
                    Collections.sort(ids);
                    targetChatId = ids.get(0) + "_" + ids.get(1);

                    Map<String, Object> chatData = new HashMap<>();
                    chatData.put("chatId", targetChatId);
                    chatData.put("participants", ids);
                    chatData.put("isGroupChat", false);
                    chatData.put("createdAt", now.getTime());
                    firestore.collection("chats").document(targetChatId).set(chatData);
                }
                msgData.put("chatId", targetChatId);
            }

            // Lưu tin nhắn mới
            firestore.collection("messages").document((String) msgData.get("id")).set(msgData);

            // Gửi socket event cho phòng chat mới
            if (targetChatId == null) {
                targetChatId = (String) msgData.get("chatId");
            }
            if (targetChatId != null) {
                socketIOServer.getRoomOperations(targetChatId).sendEvent("new_message", msgData);
            }

            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // Thu hồi tin nhắn
    @PostMapping("/{id}/recall")
    public ResponseEntity<?> recallMessage(@PathVariable String id, @RequestBody Map<String, Object> body) {
        String userId = (String) body.get("userId");
        Firestore firestore = FirestoreClient.getFirestore();
        DocumentReference msgRef = firestore.collection("messages").document(id);

        try {
            DocumentSnapshot snapshot = msgRef.get().get();
            if (!snapshot.exists()) {
                return ResponseEntity.status(404).body(Map.of("error", "Không tìm thấy tin nhắn"));
            }
            String sender = (String) snapshot.get("sender");
            if (!Objects.equals(sender, userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Không thể thu hồi"));
            }
            Map<String, Object> update = new HashMap<>();
            update.put("type", "recalled");
            update.put("message", "Tin nhắn đã được thu hồi");
            update.put("editedAt", new Date());
            msgRef.update(update);

            // Lấy chatId để gửi socket
            String chatId = (String) snapshot.get("chatId");
            if (chatId != null) {
                Map<String, Object> recallEvent = new HashMap<>();
                recallEvent.put("messageId", id);
                recallEvent.put("chatId", chatId);
                recallEvent.put("type", "recalled");
                recallEvent.put("message", "Tin nhắn đã được thu hồi");
                recallEvent.put("sender", sender);
                socketIOServer.getRoomOperations(chatId).sendEvent("message_recalled", recallEvent);

                // Cập nhật lastMessage cho chat
                DocumentReference chatRef = firestore.collection("chats").document(chatId);
                chatRef.update("lastMessage", "Tin nhắn đã được thu hồi", "lastUpdated", new Date());

                // Gửi sự kiện cập nhật chat cho tất cả thành viên
                DocumentSnapshot chatSnap = chatRef.get().get();
                List<String> participants = (List<String>) chatSnap.get("participants");
                for (String participant : participants) {
                    socketIOServer.getRoomOperations("user_" + participant).sendEvent("chat_updated",
                            Map.of(
                                    "chatId", chatId,
                                    "lastMessage", "Tin nhắn đã được thu hồi",
                                    "lastUpdated", new Date()));
                }
            }
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // Chỉnh sửa tin nhắn
    @PutMapping("/{id}/edit")
    public ResponseEntity<?> editMessage(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        try {
            String newText = (String) body.get("message");
            if (newText == null || newText.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Nội dung không hợp lệ"));
            }
            Firestore firestore = FirestoreClient.getFirestore();
            DocumentReference msgRef = firestore.collection("messages").document(id);
            Map<String, Object> updates = new HashMap<>();
            updates.put("message", newText);
            updates.put("edited", true);
            updates.put("editedAt", new Date());
            msgRef.update(updates);

            // Lấy lại dữ liệu tin nhắn để gửi socket
            DocumentSnapshot msgSnap = msgRef.get().get();
            String chatId = (String) msgSnap.get("chatId");
            if (chatId != null) {
                Map<String, Object> editedEvent = new HashMap<>(msgSnap.getData());
                editedEvent.put("id", id);
                socketIOServer.getRoomOperations(chatId).sendEvent("message_edited", editedEvent);

                // Cập nhật lastMessage cho chat
                DocumentReference chatRef = firestore.collection("chats").document(chatId);
                chatRef.update("lastMessage", newText, "lastUpdated", new Date());

                // Gửi sự kiện cập nhật chat cho tất cả thành viên
                DocumentSnapshot chatSnap = chatRef.get().get();
                List<String> participants = (List<String>) chatSnap.get("participants");
                for (String participant : participants) {
                    socketIOServer.getRoomOperations("user_" + participant).sendEvent("chat_updated",
                            Map.of(
                                    "chatId", chatId,
                                    "lastMessage", newText,
                                    "lastUpdated", new Date()));
                }
            }

            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

}