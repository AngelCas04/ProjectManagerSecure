package com.projectmanager.platform.service;

import com.projectmanager.platform.domain.MembershipStatus;
import com.projectmanager.platform.domain.Project;
import com.projectmanager.platform.repository.ProjectMemberRepository;
import com.projectmanager.platform.repository.ProjectRepository;
import com.projectmanager.platform.security.AuthenticatedUser;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ProjectAccessService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;

    public ProjectAccessService(ProjectRepository projectRepository, ProjectMemberRepository projectMemberRepository) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
    }

    public Project requireProjectAccess(UUID projectId, AuthenticatedUser user) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Project not found."));

        if (user.isAdmin()) {
            return project;
        }

        return projectMemberRepository.findByProjectIdAndUserId(projectId, user.userId())
            .filter(member -> member.getStatus() == MembershipStatus.ACTIVE)
            .map(member -> project)
            .orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "Project access denied."));
    }

    public List<Project> accessibleProjects(AuthenticatedUser user) {
        if (user.isAdmin()) {
            return projectRepository.findAll();
        }

        List<UUID> ids = projectMemberRepository.findByUserIdAndStatus(user.userId(), MembershipStatus.ACTIVE)
            .stream()
            .map(member -> member.getProject().getId())
            .toList();

        return ids.isEmpty() ? List.of() : projectRepository.findAllById(ids);
    }
}
