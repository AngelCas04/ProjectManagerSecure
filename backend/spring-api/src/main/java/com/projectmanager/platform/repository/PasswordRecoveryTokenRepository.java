package com.projectmanager.platform.repository;

import com.projectmanager.platform.domain.PasswordRecoveryToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PasswordRecoveryTokenRepository extends JpaRepository<PasswordRecoveryToken, UUID> {
    Optional<PasswordRecoveryToken> findByTokenHash(String tokenHash);
    List<PasswordRecoveryToken> findAllByUserIdAndConsumedAtIsNull(UUID userId);
}
