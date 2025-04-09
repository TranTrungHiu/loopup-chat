package com.loopupchat.auth.dto;

import lombok.Data;

@Data
public class SignUpRequest {
    private String firstName;
    private String lastName;
    private String gender;
    private String avatarUrl; // link ảnh đại diện (có thể null)
    private String email;
    private String password;
}
