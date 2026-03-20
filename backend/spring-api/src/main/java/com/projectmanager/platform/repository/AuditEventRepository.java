package com.projectmanager.platform.repository;

import com.projectmanager.platform.domain.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {
    List<AuditEvent> findTop200ByProjectIdInOrderByCreatedAtDesc(List<UUID> projectIds);

    @Query("select count(a) from AuditEvent a where a.createdAt >= :since")
    long countSince(Instant since);
}
