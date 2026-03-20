package com.projectmanager.platform.repository;

import com.projectmanager.platform.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    long countByExpiresAtAfterAndRevokedAtIsNull(Instant now);
}
