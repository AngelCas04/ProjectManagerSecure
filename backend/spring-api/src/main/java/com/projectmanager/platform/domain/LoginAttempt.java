package com.projectmanager.platform.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "login_attempt", indexes = {
    @Index(name = "idx_login_attempt_email_time", columnList = "email,attempted_at"),
    @Index(name = "idx_login_attempt_ip_time", columnList = "ip_address,attempted_at")
})
public class LoginAttempt {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 190)
    private String email;

    @Column(name = "ip_address", nullable = false, length = 60)
    private String ipAddress;

    @Column(nullable = false)
    private boolean success;

    @Column(name = "attempted_at", nullable = false)
    private Instant attemptedAt;

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public Instant getAttemptedAt() {
        return attemptedAt;
    }

    public void setAttemptedAt(Instant attemptedAt) {
        this.attemptedAt = attemptedAt;
    }
}
