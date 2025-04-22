package com.loopupchat.auth.model;
import lombok.Data;
import lombok.AllArgsConstructor;
import  lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {
    private String uid;
    private String firstName;
    private String lastName;
    private String email;
    private String avatarURL;
    private String gender;
}
