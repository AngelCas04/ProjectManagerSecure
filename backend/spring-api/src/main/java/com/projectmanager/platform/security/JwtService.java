package com.projectmanager.platform.security;

import com.projectmanager.platform.config.SecurityProperties;
import com.projectmanager.platform.domain.RoleName;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecurityProperties securityProperties;
    private SecretKey secretKey;

    public JwtService(SecurityProperties securityProperties) {
        this.securityProperties = securityProperties;
    }

    @PostConstruct
    void init() {
        secretKey = Keys.hmacShaKeyFor(securityProperties.getJwtSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(AuthenticatedUser user) {
        Instant expiresAt = user.issuedAt().plusSeconds(securityProperties.getAccessTokenTtlSeconds());

        return Jwts.builder()
            .issuer(securityProperties.getIssuer())
            .subject(user.email())
            .claim("uid", user.userId().toString())
            .claim("name", user.displayName())
            .claim("role", user.role().name())
            .claim("sid", user.sessionId())
            .issuedAt(Date.from(user.issuedAt()))
            .expiration(Date.from(expiresAt))
            .signWith(secretKey)
            .compact();
    }

    public AuthenticatedUser parse(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(secretKey)
            .requireIssuer(securityProperties.getIssuer())
            .build()
            .parseSignedClaims(token)
            .getPayload();

        return new AuthenticatedUser(
            UUID.fromString(claims.get("uid", String.class)),
            claims.getSubject(),
            claims.get("name", String.class),
            RoleName.valueOf(claims.get("role", String.class)),
            claims.get("sid", String.class),
            claims.getIssuedAt().toInstant()
        );
    }

    public int getAccessTokenTtlSeconds() {
        return securityProperties.getAccessTokenTtlSeconds();
    }
}
