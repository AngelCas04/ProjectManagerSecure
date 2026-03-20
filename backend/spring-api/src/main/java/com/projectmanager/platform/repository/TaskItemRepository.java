package com.projectmanager.platform.repository;

import com.projectmanager.platform.domain.TaskItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskItemRepository extends JpaRepository<TaskItem, UUID> {
    List<TaskItem> findByProjectIdOrderByDueDateAsc(UUID projectId);
    List<TaskItem> findByProjectIdInOrderByDueDateAsc(List<UUID> projectIds);
}
