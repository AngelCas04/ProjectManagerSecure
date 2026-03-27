package com.projectmanager.platform.repository;

import com.projectmanager.platform.domain.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {
    List<ChatRoom> findByWorkGroupIdInOrderByNameAsc(Collection<UUID> workGroupIds);
    List<ChatRoom> findByWorkGroupIdInOrderByDefaultRoomDescCreatedAtAsc(Collection<UUID> workGroupIds);
    List<ChatRoom> findByProjectIdIn(Collection<UUID> projectIds);
    java.util.Optional<ChatRoom> findByProjectIdAndWorkGroupId(UUID projectId, UUID workGroupId);
    java.util.Optional<ChatRoom> findByProjectIdAndWorkGroupIdAndDefaultRoomTrue(UUID projectId, UUID workGroupId);
    java.util.Optional<ChatRoom> findByWorkGroupIdAndSlugIgnoreCase(UUID workGroupId, String slug);
    long countByWorkGroupId(UUID workGroupId);
}
