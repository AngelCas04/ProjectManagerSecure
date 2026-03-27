package com.projectmanager.platform.service;

import com.projectmanager.platform.domain.MembershipStatus;
import com.projectmanager.platform.domain.Project;
import com.projectmanager.platform.repository.WorkGroupMemberRepository;
import com.projectmanager.platform.repository.WorkGroupRepository;
import com.projectmanager.platform.repository.ProjectMemberRepository;
import com.projectmanager.platform.repository.ProjectRepository;
import com.projectmanager.platform.security.AuthenticatedUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ProjectAccessService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final WorkGroupRepository workGroupRepository;
    private final WorkGroupMemberRepository workGroupMemberRepository;

    public ProjectAccessService(
        ProjectRepository projectRepository,
        ProjectMemberRepository projectMemberRepository,
        WorkGroupRepository workGroupRepository,
        WorkGroupMemberRepository workGroupMemberRepository
    ) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.workGroupRepository = workGroupRepository;
        this.workGroupMemberRepository = workGroupMemberRepository;
    }

    @Transactional(readOnly = true)
    public Project requireProjectAccess(UUID projectId, AuthenticatedUser user) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Project not found."));

        boolean directAccess = projectMemberRepository.findByProjectIdAndUserId(projectId, user.userId())
            .filter(member -> member.getStatus() == MembershipStatus.ACTIVE)
            .isPresent();

        if (directAccess || hasTeamAccess(projectId, user.userId())) {
            return project;
        }

        throw new ResponseStatusException(FORBIDDEN, "Project access denied.");
    }

    @Transactional(readOnly = true)
    public List<Project> accessibleProjects(AuthenticatedUser user) {
        Set<UUID> ids = new LinkedHashSet<>(projectMemberRepository.findByUserIdAndStatus(user.userId(), MembershipStatus.ACTIVE)
            .stream()
            .map(member -> member.getProject().getId())
            .toList());

        workGroupMemberRepository.findByUserIdAndStatus(user.userId(), MembershipStatus.ACTIVE).stream()
            .map(member -> member.getWorkGroup().getId())
            .flatMap(workGroupId -> workGroupRepository.findById(workGroupId).stream())
            .flatMap(group -> group.getProjects().stream())
            .map(Project::getId)
            .forEach(ids::add);

        return ids.isEmpty() ? List.of() : projectRepository.findAllById(ids);
    }

    private boolean hasTeamAccess(UUID projectId, UUID userId) {
        return workGroupMemberRepository.findByUserIdAndStatus(userId, MembershipStatus.ACTIVE).stream()
            .map(member -> member.getWorkGroup())
            .anyMatch(group -> group.getProjects().stream().anyMatch(project -> project.getId().equals(projectId)));
    }
}
