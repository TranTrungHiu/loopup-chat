package com.loopupchat.auth.dto;

public class UpdateVerificationRequest {
    private String uid;
    private boolean verified;

    public UpdateVerificationRequest() {
    }

    public UpdateVerificationRequest(String uid, boolean verified) {
        this.uid = uid;
        this.verified = verified;
    }

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }
}