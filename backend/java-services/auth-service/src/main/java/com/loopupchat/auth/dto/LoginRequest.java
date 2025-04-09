package com.loopupchat.auth.dto;
import lombok.Data;
@Data
public class LoginRequest {
    private String idToken; // Firebase ID Token từ frontend

}
