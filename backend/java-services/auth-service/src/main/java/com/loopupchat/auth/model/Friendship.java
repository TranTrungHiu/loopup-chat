package com.loopupchat.auth.model;
import lombok.Data;
import lombok.AllArgsConstructor;
import  lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Friendship {
    private String id;         // UUID
    private String userId1;    // Người gửi lời mời
    private String userId2;    // Người nhận lời mời
    private String status;     // "pending", "accepted", "rejected"
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}