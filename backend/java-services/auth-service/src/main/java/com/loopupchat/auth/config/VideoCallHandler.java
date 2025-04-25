package com.loopupchat.auth.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class VideoCallHandler extends TextWebSocketHandler {

    private static final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userId = getUserId(session);
        if (userId != null) {
            sessions.put(userId, session);
            System.out.println("New session added: " + userId);
            System.out.println("Current sessions: " + sessions.keySet());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userId = getUserId(session);
        if (userId != null) {
            sessions.remove(userId);
            System.out.println("Session removed: " + userId);
            System.out.println("Current sessions: " + sessions.keySet());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Map<String, Object> msg = objectMapper.readValue(message.getPayload(), Map.class);
        String to = (String) msg.get("to");
        String from = (String) msg.get("from");
        String type = (String) msg.get("type");
        System.out.println("Received message: type=" + type + ", from=" + from + ", to=" + to);
        System.out.println("Current sessions: " + sessions.keySet());
        WebSocketSession recipient = sessions.get(to);

        if (recipient != null && recipient.isOpen()) {
            System.out.println("Forwarding message to: " + to);
            recipient.sendMessage(new TextMessage(message.getPayload()));
        } else {
            System.out.println("Recipient not found or connection closed: " + to);
            session.sendMessage(new TextMessage(
                    "{\"type\":\"error\",\"message\":\"Recipient not available\"}"));
        }
    }

    private String getUserId(WebSocketSession session) {
        String query = session.getUri().getQuery();
        if (query != null && query.contains("userId=")) {
            return query.split("userId=")[1];
        }
        return null;
    }
}