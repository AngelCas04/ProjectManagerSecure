package com.projectmanager.platform.repository;

import com.projectmanager.platform.domain.MembershipStatus;
import com.projectmanager.platform.domain.WorkGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkGroupMemberRepository extends JpaRepository<WorkGroupMember, UUID> {
    Optional<WorkGroupMember> findByWorkGroupIdAndUserId(UUID workGroupId, UUID userId);
    List<WorkGroupMember> findByUserIdAndStatus(UUID userId, MembershipStatus status);
    List<WorkGroupMember> findByWorkGroupIdAndStatusOrderByCreatedAtAsc(UUID workGroupId, MembershipStatus status);
    List<WorkGroupMember> findByWorkGroupIdInAndStatus(Collection<UUID> workGroupIds, MembershipStatus status);
    long countByWorkGroupIdAndStatus(UUID workGroupId, MembershipStatus status);
}
