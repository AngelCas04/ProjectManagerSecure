package com.projectmanager.platform.repository;

import com.projectmanager.platform.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findTop100ByProjectIdInOrderByCreatedAtAsc(List<UUID> projectIds);
    List<ChatMessage> findTop100ByProjectIdInAndChatTeamOrderByCreatedAtAsc(Collection<UUID> projectIds, String chatTeam);
}
