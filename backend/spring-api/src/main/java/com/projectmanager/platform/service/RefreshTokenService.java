package com.projectmanager.platform.service;

import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.RefreshToken;
import com.projectmanager.platform.repository.RefreshTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public IssuedRefreshToken issue(AppUser user, int ttlSeconds, String ipAddress, String userAgent) {
        String raw = randomToken();
        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setTokenHash(hash(raw));
        token.setExpiresAt(Instant.now().plusSeconds(ttlSeconds));
        token.setCreatedByIp(ipAddress);
        token.setUserAgent(userAgent);
        refreshTokenRepository.save(token);
        return new IssuedRefreshToken(raw, token);
    }

    public RefreshToken verify(String rawToken) {
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash(rawToken))
            .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid refresh token."));

        if (token.getRevokedAt() != null || token.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Refresh token expired.");
        }

        return token;
    }

    public void revoke(String rawToken, String ipAddress) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        refreshTokenRepository.findByTokenHash(hash(rawToken)).ifPresent(token -> {
            token.setRevokedAt(Instant.now());
            token.setReplacedByIp(ipAddress);
            refreshTokenRepository.save(token);
        });
    }

    public void revokeAllForUser(UUID userId, String ipAddress) {
        refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(userId).forEach(token -> {
            token.setRevokedAt(Instant.now());
            token.setReplacedByIp(ipAddress);
            refreshTokenRepository.save(token);
        });
    }

    private String randomToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawValue) {
        try {
            byte[] bytes = MessageDigest.getInstance("SHA-256").digest(rawValue.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte value : bytes) {
                builder.append(String.format("%02x", value));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 unavailable.", ex);
        }
    }

    public record IssuedRefreshToken(String rawValue, RefreshToken entity) {
    }
}
