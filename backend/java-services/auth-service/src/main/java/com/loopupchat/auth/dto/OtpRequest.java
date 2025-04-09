package com.loopupchat.auth.dto;

public class OtpRequest {
    private String email;
    private String uid;

    public OtpRequest() {
    }

    public OtpRequest(String email, String uid) {
        this.email = email;
        this.uid = uid;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }
}