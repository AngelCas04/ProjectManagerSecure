package com.projectmanager.platform.repository;

import com.projectmanager.platform.domain.CalendarEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CalendarEntryRepository extends JpaRepository<CalendarEntry, UUID> {
    List<CalendarEntry> findByProjectIdInOrderByDateAscTimeAsc(List<UUID> projectIds);
}
