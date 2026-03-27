package com.projectmanager.platform.repository;

import com.projectmanager.platform.domain.WorkGroupInvitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkGroupInvitationRepository extends JpaRepository<WorkGroupInvitation, UUID> {
    Optional<WorkGroupInvitation> findByTokenHash(String tokenHash);
    List<WorkGroupInvitation> findByWorkGroupIdAndAcceptedAtIsNullAndRevokedAtIsNullOrderByCreatedAtDesc(UUID workGroupId);
    Optional<WorkGroupInvitation> findByWorkGroupIdAndEmailIgnoreCaseAndAcceptedAtIsNullAndRevokedAtIsNull(UUID workGroupId, String email);
}
