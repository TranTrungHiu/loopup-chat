package com.loopupchat.auth.service;

import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIONamespace;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SocketIOService {

    private final SocketIOServer server;
    private final FirebaseAuth firebaseAuth;

    // Lưu trữ thông tin kết nối client: session ID -> user ID
    private final Map<UUID, String> sessionToUserMapping = new ConcurrentHashMap<>();
    // Lưu trữ thông tin kết nối user: user ID -> session ID
    private final Map<String, UUID> userToSessionMapping = new ConcurrentHashMap<>();

    @Autowired
    public SocketIOService(SocketIOServer server, FirebaseAuth firebaseAuth) {
        this.server = server;
        this.firebaseAuth = firebaseAuth;
    }

    @PostConstruct
    public void init() {
        // Thiết lập các trình xử lý sự kiện Socket.IO
        setupEventHandlers();
    }

    private void setupEventHandlers() {
        // Xử lý khi client kết nối
        server.addConnectListener(new ConnectListener() {
            @Override
            public void onConnect(SocketIOClient client) {
                System.out.println("Client connected: " + client.getSessionId());
            }
        });

        // Xử lý khi client ngắt kết nối
        server.addDisconnectListener(new DisconnectListener() {
            @Override
            public void onDisconnect(SocketIOClient client) {
                handleDisconnect(client);
            }
        });

        // Xử lý sự kiện xác thực
        server.addEventListener("authenticate", Map.class, new DataListener<Map>() {
            @Override
            public void onData(SocketIOClient client, Map data, AckRequest ackRequest) {
                handleAuthentication(client, data, ackRequest);
            }
        });

        // Xử lý sự kiện tham gia phòng chat
        server.addEventListener("join_chat", String.class, new DataListener<String>() {
            @Override
            public void onData(SocketIOClient client, String chatId, AckRequest ackRequest) {
                handleJoinChat(client, chatId, ackRequest);
            }
        });

        // Xử lý sự kiện rời phòng chat
        server.addEventListener("leave_chat", String.class, new DataListener<String>() {
            @Override
            public void onData(SocketIOClient client, String chatId, AckRequest ackRequest) {
                handleLeaveChat(client, chatId, ackRequest);
            }
        });

        // Xử lý sự kiện gửi tin nhắn
        server.addEventListener("send_message", Map.class, new DataListener<Map>() {
            @Override
            public void onData(SocketIOClient client, Map messageData, AckRequest ackRequest) {
                handleSendMessage(client, messageData, ackRequest);
            }
        });

        // Xử lý sự kiện bắt đầu typing
        server.addEventListener("typing_start", String.class, new DataListener<String>() {
            @Override
            public void onData(SocketIOClient client, String chatId, AckRequest ackRequest) {
                handleTypingStart(client, chatId, ackRequest);
            }
        });

        // Xử lý sự kiện kết thúc typing
        server.addEventListener("typing_end", String.class, new DataListener<String>() {
            @Override
            public void onData(SocketIOClient client, String chatId, AckRequest ackRequest) {
                handleTypingEnd(client, chatId, ackRequest);
            }
        });
    }

    private void handleDisconnect(SocketIOClient client) {
        UUID sessionId = client.getSessionId();
        String userId = sessionToUserMapping.get(sessionId);

        if (userId != null) {
            System.out.println("User disconnected: " + userId);
            sessionToUserMapping.remove(sessionId);
            userToSessionMapping.remove(userId);

            // Thông báo cho các client khác biết người dùng đã offline
            server.getBroadcastOperations().sendEvent("user_offline", userId);
        }

        System.out.println("Client disconnected: " + sessionId);
    }

    private void handleAuthentication(SocketIOClient client, Map data, AckRequest ackRequest) {
        try {
            String token = (String) data.get("token");
            if (token == null) {
                sendAuthResponse(client, false, "Không tìm thấy token", null);
                return;
            }

            // Xác thực token với Firebase
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(token);
            String userId = decodedToken.getUid();

            // Lưu thông tin ánh xạ session - user
            sessionToUserMapping.put(client.getSessionId(), userId);
            userToSessionMapping.put(userId, client.getSessionId());

            // Tham gia vào phòng chat riêng của người dùng để nhận thông báo
            client.joinRoom("user_" + userId);

            System.out.println("User authenticated: " + userId);

            // Thông báo cho các client khác biết người dùng đã online
            server.getBroadcastOperations().sendEvent("user_online", userId);

            // Gửi phản hồi thành công
            sendAuthResponse(client, true, null, userId);

            // Gửi danh sách người dùng online
            client.sendEvent("online_users", userToSessionMapping.keySet());

        } catch (FirebaseAuthException e) {
            System.err.println("Authentication error: " + e.getMessage());
            sendAuthResponse(client, false, "Token không hợp lệ: " + e.getMessage(), null);
        } catch (Exception e) {
            System.err.println("Error during authentication: " + e.getMessage());
            sendAuthResponse(client, false, "Lỗi xác thực: " + e.getMessage(), null);
        }
    }

    private void sendAuthResponse(SocketIOClient client, boolean success, String error, String userId) {
        Map<String, Object> response = new ConcurrentHashMap<>();
        response.put("success", success);
        if (error != null) {
            response.put("error", error);
        }
        if (userId != null) {
            response.put("userId", userId);
        }
        client.sendEvent("authenticated", response);
    }

    private void handleJoinChat(SocketIOClient client, String chatId, AckRequest ackRequest) {
        String userId = sessionToUserMapping.get(client.getSessionId());
        if (userId == null) {
            sendErrorResponse(client, "join_chat_response", "Người dùng chưa được xác thực", ackRequest);
            return;
        }

        // Tham gia vào phòng chat
        client.joinRoom(chatId);

        System.out.println("User " + userId + " joined chat: " + chatId);

        // Thông báo cho các client khác trong phòng
        server.getRoomOperations(chatId).sendEvent("user_joined", Map.of(
                "userId", userId,
                "chatId", chatId,
                "timestamp", System.currentTimeMillis()));

        // Gửi phản hồi thành công
        if (ackRequest.isAckRequested()) {
            ackRequest.sendAckData(Map.of(
                    "status", "success",
                    "chatId", chatId));
        }
    }

    private void handleLeaveChat(SocketIOClient client, String chatId, AckRequest ackRequest) {
        String userId = sessionToUserMapping.get(client.getSessionId());
        if (userId == null) {
            sendErrorResponse(client, "leave_chat_response", "Người dùng chưa được xác thực", ackRequest);
            return;
        }

        // Rời phòng chat
        client.leaveRoom(chatId);

        System.out.println("User " + userId + " left chat: " + chatId);

        // Thông báo cho các client khác trong phòng
        server.getRoomOperations(chatId).sendEvent("user_left", Map.of(
                "userId", userId,
                "chatId", chatId,
                "timestamp", System.currentTimeMillis()));

        // Gửi phản hồi thành công
        if (ackRequest.isAckRequested()) {
            ackRequest.sendAckData(Map.of(
                    "status", "success",
                    "chatId", chatId));
        }
    }

    private void handleSendMessage(SocketIOClient client, Map messageData, AckRequest ackRequest) {
        String userId = sessionToUserMapping.get(client.getSessionId());
        if (userId == null) {
            sendErrorResponse(client, "send_message_response", "Người dùng chưa được xác thực", ackRequest);
            return;
        }

        String chatId = (String) messageData.get("chatId");
        String sender = (String) messageData.get("sender");
        String message = (String) messageData.get("message");

        // Kiểm tra xem chatId và message có tồn tại không
        if (chatId == null || message == null) {
            sendErrorResponse(client, "send_message_response", "Thiếu thông tin tin nhắn", ackRequest);
            return;
        }

        // Kiểm tra xem sender có khớp với userId của người dùng đã xác thực không
        if (!userId.equals(sender)) {
            sendErrorResponse(client, "send_message_response", "Người gửi không hợp lệ", ackRequest);
            return;
        }

        // Thêm thời gian gửi tin nhắn
        messageData.put("timestamp", System.currentTimeMillis());
        messageData.put("status", "sent");

        // Phát tin nhắn đến tất cả người dùng trong phòng chat
        server.getRoomOperations(chatId).sendEvent("new_message", messageData);

        // Gửi phản hồi thành công
        if (ackRequest.isAckRequested()) {
            ackRequest.sendAckData(Map.of(
                    "status", "success",
                    "messageId", messageData.get("id"),
                    "timestamp", messageData.get("timestamp")));
        }
    }

    private void handleTypingStart(SocketIOClient client, String chatId, AckRequest ackRequest) {
        String userId = sessionToUserMapping.get(client.getSessionId());
        if (userId == null) {
            sendErrorResponse(client, "typing_response", "Người dùng chưa được xác thực", ackRequest);
            return;
        }

        // Thông báo cho các client khác trong phòng chat (ngoại trừ người gửi)
        server.getRoomOperations(chatId).sendEvent("typing_indicator", Map.of(
                "userId", userId,
                "chatId", chatId,
                "isTyping", true));
    }

    private void handleTypingEnd(SocketIOClient client, String chatId, AckRequest ackRequest) {
        String userId = sessionToUserMapping.get(client.getSessionId());
        if (userId == null) {
            sendErrorResponse(client, "typing_response", "Người dùng chưa được xác thực", ackRequest);
            return;
        }

        // Thông báo cho các client khác trong phòng chat (ngoại trừ người gửi)
        server.getRoomOperations(chatId).sendEvent("typing_indicator", Map.of(
                "userId", userId,
                "chatId", chatId,
                "isTyping", false));
    }

    private void sendErrorResponse(SocketIOClient client, String event, String errorMessage, AckRequest ackRequest) {
        System.err.println(errorMessage);

        if (ackRequest.isAckRequested()) {
            ackRequest.sendAckData(Map.of(
                    "status", "error",
                    "message", errorMessage));
        } else {
            client.sendEvent(event, Map.of(
                    "status", "error",
                    "message", errorMessage));
        }
    }

    // Helper method để gửi tin nhắn đến phòng chat cụ thể
    public void sendMessageToRoom(String chatId, String eventName, Object data) {
        server.getRoomOperations(chatId).sendEvent(eventName, data);
    }

    // Helper method để gửi tin nhắn đến người dùng cụ thể
    public void sendMessageToUser(String userId, String eventName, Object data) {
        UUID sessionId = userToSessionMapping.get(userId);
        if (sessionId != null) {
            server.getClient(sessionId).sendEvent(eventName, data);
        }
    }

    // Helper method để gửi tin nhắn đến tất cả người dùng
    public void broadcastMessage(String eventName, Object data) {
        server.getBroadcastOperations().sendEvent(eventName, data);
    }

    // Helper method để kiểm tra xem người dùng có online không
    public boolean isUserOnline(String userId) {
        return userToSessionMapping.containsKey(userId);
    }

    // Helper method để lấy danh sách người dùng online
    public Iterable<String> getOnlineUsers() {
        return userToSessionMapping.keySet();
    }

    @PreDestroy
    public void stop() {
        System.out.println("Stopping SocketIO service...");
    }
}