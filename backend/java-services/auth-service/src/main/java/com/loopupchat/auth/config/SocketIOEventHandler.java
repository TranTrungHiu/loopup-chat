package com.loopupchat.auth.config;

import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SocketIOEventHandler {

    private static final Logger logger = LoggerFactory.getLogger(SocketIOEventHandler.class);
    private final ConcurrentHashMap<UUID, String> sessionUserMap = new ConcurrentHashMap<>();
    private final SocketIOServer socketServer;

    public SocketIOEventHandler(SocketIOServer socketServer) {
        this.socketServer = socketServer;

        // Register event handlers
        socketServer.addConnectListener(this::onConnect);
        socketServer.addDisconnectListener(this::onDisconnect);

        // Listen for JOIN_ROOM events
        socketServer.addEventListener("join_room", String.class, (client, roomId, ackRequest) -> {
            logger.info("Client {} joining room: {}", client.getSessionId(), roomId);
            client.joinRoom(roomId);

            if (ackRequest.isAckRequested()) {
                Map<String, Object> data = new HashMap<>();
                data.put("status", "OK");
                data.put("message", "Joined room: " + roomId);
                ackRequest.sendAckData(data);
            }
        });        // Listen for LEAVE_ROOM events
        socketServer.addEventListener("leave_room", String.class, (client, roomId, ackRequest) -> {
            logger.info("Client {} leaving room: {}", client.getSessionId(), roomId);
            client.leaveRoom(roomId);

            if (ackRequest.isAckRequested()) {
                Map<String, Object> data = new HashMap<>();
                data.put("status", "OK");
                data.put("message", "Left room: " + roomId);
                ackRequest.sendAckData(data);
            }
        });

        // Listen for GROUP_CREATED events
        socketServer.addEventListener("group_created", Map.class, (client, groupData, ackRequest) -> {
            logger.info("=== GROUP CREATED EVENT RECEIVED ===");
            logger.info("Client session ID: {}", client.getSessionId());
            logger.info("Group data received: {}", groupData);

            try {
                // Lấy thông tin từ groupData
                Object chatObj = groupData.get("chat");
                Object memberIdsObj = groupData.get("memberIds");

                logger.info("Chat object: {}", chatObj);
                logger.info("Member IDs object: {}", memberIdsObj);

                if (chatObj == null || memberIdsObj == null) {
                    logger.error("Missing group information - chat: {}, memberIds: {}", chatObj, memberIdsObj);
                    return;
                }

                // Gửi thông báo đến tất cả các thành viên trong nhóm
                if (memberIdsObj instanceof java.util.List) {
                    @SuppressWarnings("unchecked")
                    java.util.List<String> memberIds = (java.util.List<String>) memberIdsObj;
                    
                    logger.info("Total members: {}", memberIds.size());
                    logger.info("Current sessions: {}", sessionUserMap.values());
                    
                    for (String memberId : memberIds) {
                        logger.info("Processing member: {}", memberId);
                        
                        // Tìm session ID của member
                        UUID memberSessionId = null;
                        for (Map.Entry<UUID, String> entry : sessionUserMap.entrySet()) {
                            if (entry.getValue().equals(memberId)) {
                                memberSessionId = entry.getKey();
                                break;
                            }
                        }
                        
                        if (memberSessionId != null) {
                            // Gửi thông báo đến member
                            socketServer.getClient(memberSessionId).sendEvent("group_created", groupData);
                            logger.info("✓ Sent group_created notification to user: {}", memberId);
                        } else {
                            logger.info("✗ User {} is offline, session not found", memberId);
                        }
                    }
                } else {
                    logger.error("memberIds is not a List: {}", memberIdsObj.getClass());
                }

                // Gửi phản hồi thành công cho người tạo nhóm
                if (ackRequest.isAckRequested()) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("status", "success");
                    response.put("message", "Thông báo nhóm đã được gửi đến các thành viên");
                    ackRequest.sendAckData(response);
                }

                logger.info("✓ Group created event processed successfully");

            } catch (Exception e) {
                logger.error("Error processing group_created event: {}", e.getMessage(), e);
            }        });        // Listen for TYPING_START events
        socketServer.addEventListener("typing_start", Map.class, (client, data, ackRequest) -> {
            String chatId = (String) data.get("chatId");
            String userId = sessionUserMap.get(client.getSessionId());
            
            logger.info("=== TYPING_START EVENT ===");
            logger.info("Session ID: {}", client.getSessionId());
            logger.info("Data received: {}", data);
            logger.info("User ID from session: {}", userId);
            logger.info("Current session map: {}", sessionUserMap);
            
            if (userId != null && chatId != null) {
                logger.info("User {} started typing in chat {}", userId, chatId);
                
                // Broadcast typing indicator to other users in the chat room
                Map<String, Object> typingData = new HashMap<>();
                typingData.put("userId", userId);
                typingData.put("chatId", chatId);
                typingData.put("isTyping", true);
                typingData.put("timestamp", System.currentTimeMillis());
                
                // Send to all clients in the chat room except the sender
                socketServer.getRoomOperations(chatId).sendEvent("typing_indicator", typingData);
                logger.info("✓ Broadcasted typing_start for user {} in chat {}", userId, chatId);
            } else {
                logger.warn("✗ Cannot process typing_start - userId: {}, chatId: {}", userId, chatId);
            }
        });

        // Listen for TYPING_END events
        socketServer.addEventListener("typing_end", Map.class, (client, data, ackRequest) -> {
            String chatId = (String) data.get("chatId");
            String userId = sessionUserMap.get(client.getSessionId());
            
            if (userId != null && chatId != null) {
                logger.info("User {} stopped typing in chat {}", userId, chatId);
                
                // Broadcast typing indicator to other users in the chat room
                Map<String, Object> typingData = new HashMap<>();
                typingData.put("userId", userId);
                typingData.put("chatId", chatId);
                typingData.put("isTyping", false);
                typingData.put("timestamp", System.currentTimeMillis());
                
                // Send to all clients in the chat room except the sender
                socketServer.getRoomOperations(chatId).sendEvent("typing_indicator", typingData);
                logger.info("Broadcasted typing_end for user {} in chat {}", userId, chatId);
            }
        });

        // Listen for USER_STATUS events (online/offline)
        socketServer.addEventListener("user_status", Map.class, (client, data, ackRequest) -> {
            String userId = (String) data.get("userId");
            String status = (String) data.get("status"); // "online" or "offline"
            
            if (userId != null && status != null) {
                logger.info("User {} status changed to: {}", userId, status);
                
                // Update session mapping if going online
                if ("online".equals(status)) {
                    sessionUserMap.put(client.getSessionId(), userId);
                    // Join user's personal room
                    client.joinRoom("user_" + userId);
                }
                
                // Broadcast status to all connected clients
                Map<String, Object> statusData = new HashMap<>();
                statusData.put("userId", userId);
                statusData.put("status", status);
                statusData.put("timestamp", System.currentTimeMillis());
                
                socketServer.getBroadcastOperations().sendEvent("user_status_changed", statusData);
                logger.info("Broadcasted status change for user {}: {}", userId, status);
            }
        });
    }

    public void onConnect(SocketIOClient client) {
        String sessionId = client.getSessionId().toString();
        String remoteAddress = client.getRemoteAddress().toString();
        logger.info("Client connected: {} from {}", sessionId, remoteAddress);

        // Store connection parameters for diagnostics
        Map<String, Object> connectionInfo = new HashMap<>();
        connectionInfo.put("sessionId", sessionId);
        connectionInfo.put("connected", true);
        connectionInfo.put("timestamp", System.currentTimeMillis());

        // Send connect confirmation to client
        client.sendEvent("connection_status", connectionInfo);
    }    public void onDisconnect(SocketIOClient client) {
        UUID sessionId = client.getSessionId();
        logger.info("Client disconnected: {}", sessionId);

        String userId = sessionUserMap.remove(sessionId);
        if (userId != null) {
            logger.info("User {} disconnected", userId);
            
            // Broadcast offline status to all connected clients
            Map<String, Object> statusData = new HashMap<>();
            statusData.put("userId", userId);
            statusData.put("status", "offline");
            statusData.put("timestamp", System.currentTimeMillis());
            
            socketServer.getBroadcastOperations().sendEvent("user_status_changed", statusData);
            logger.info("Broadcasted offline status for user {}", userId);
        }
    }

    // Register a user ID with their socket session
    @OnEvent("register_user")
    public void onRegisterUser(SocketIOClient client, String userId) {
        logger.info("Registering user ID for session {}: {}", client.getSessionId(), userId);
        sessionUserMap.put(client.getSessionId(), userId);

        // Join user's personal room
        client.joinRoom("user_" + userId);

        // Confirm registration
        Map<String, Object> response = new HashMap<>();
        response.put("status", "registered");
        response.put("userId", userId);
        client.sendEvent("user_registered", response);
    }
}