package com.projectmanager.platform.repository;

import com.projectmanager.platform.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    long countBy();
}
