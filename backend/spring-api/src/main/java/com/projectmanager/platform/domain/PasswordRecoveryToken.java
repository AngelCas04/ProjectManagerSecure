package com.projectmanager.platform.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "password_recovery_token", indexes = {
    @Index(name = "idx_password_recovery_user", columnList = "user_id"),
    @Index(name = "idx_password_recovery_hash", columnList = "token_hash", unique = true)
})
public class PasswordRecoveryToken extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(nullable = false, length = 128, unique = true)
    private String tokenHash;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant consumedAt;

    @Column(nullable = false, length = 60)
    private String requestedByIp;

    @Column(nullable = false, length = 255)
    private String requestedUserAgent;

    public UUID getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getConsumedAt() {
        return consumedAt;
    }

    public void setConsumedAt(Instant consumedAt) {
        this.consumedAt = consumedAt;
    }

    public String getRequestedByIp() {
        return requestedByIp;
    }

    public void setRequestedByIp(String requestedByIp) {
        this.requestedByIp = requestedByIp;
    }

    public String getRequestedUserAgent() {
        return requestedUserAgent;
    }

    public void setRequestedUserAgent(String requestedUserAgent) {
        this.requestedUserAgent = requestedUserAgent;
    }
}
