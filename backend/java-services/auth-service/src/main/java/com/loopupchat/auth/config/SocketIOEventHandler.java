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
        });

        // Listen for LEAVE_ROOM events
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
    }

    public void onDisconnect(SocketIOClient client) {
        UUID sessionId = client.getSessionId();
        logger.info("Client disconnected: {}", sessionId);

        String userId = sessionUserMap.remove(sessionId);
        if (userId != null) {
            logger.info("User {} disconnected", userId);
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