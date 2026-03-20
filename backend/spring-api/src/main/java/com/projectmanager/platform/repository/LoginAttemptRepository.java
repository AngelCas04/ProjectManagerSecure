package com.projectmanager.platform.repository;

import com.projectmanager.platform.domain.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.UUID;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, UUID> {
    @Query("select count(l) from LoginAttempt l where l.success = false and l.attemptedAt >= :since")
    long countFailedSince(Instant since);
}
