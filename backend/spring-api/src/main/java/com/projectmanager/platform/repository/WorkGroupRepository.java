package com.projectmanager.platform.repository;

import com.projectmanager.platform.domain.WorkGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkGroupRepository extends JpaRepository<WorkGroup, UUID> {
    List<WorkGroup> findAllByOrderByNameAsc();
    Optional<WorkGroup> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    long countBy();
}
