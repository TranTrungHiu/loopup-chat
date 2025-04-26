package com.loopupchat.auth.model;

import java.io.Serializable;
import java.time.Instant;

/**
 * Data Transfer Object for chat messages transported via Socket.IO
 */
public class MessageDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String chatId;
    private String sender;
    private String message;
    private long timestamp;

    // Default constructor needed for Socket.IO serialization
    public MessageDTO() {
        this.timestamp = Instant.now().toEpochMilli();
    }

    public MessageDTO(String chatId, String sender, String message) {
        this.chatId = chatId;
        this.sender = sender;
        this.message = message;
        this.timestamp = Instant.now().toEpochMilli();
    }

    // Getters and setters
    public String getChatId() {
        return chatId;
    }

    public void setChatId(String chatId) {
        this.chatId = chatId;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "MessageDTO{" +
                "chatId='" + chatId + '\'' +
                ", sender='" + sender + '\'' +
                ", message='" + message + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}