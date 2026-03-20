package com.projectmanager.platform.repository;

import com.projectmanager.platform.domain.MembershipStatus;
import com.projectmanager.platform.domain.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {
    List<ProjectMember> findByUserIdAndStatus(UUID userId, MembershipStatus status);
    List<ProjectMember> findByProjectIdAndStatus(UUID projectId, MembershipStatus status);
    Optional<ProjectMember> findByProjectIdAndUserId(UUID projectId, UUID userId);
    long countByProjectIdAndStatus(UUID projectId, MembershipStatus status);
}
