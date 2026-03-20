package com.projectmanager.platform.api;

import com.projectmanager.platform.service.CurrentUserService;
import com.projectmanager.platform.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final CurrentUserService currentUserService;

    public ProjectController(ProjectService projectService, CurrentUserService currentUserService) {
        this.projectService = projectService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<ViewModels.ProjectView> listProjects() {
        return projectService.listProjects(currentUserService.requireAuthenticatedUser());
    }

    @PostMapping
    public ViewModels.ProjectView createProject(@Valid @RequestBody ProjectRequests.CreateProjectRequest request) {
        return projectService.createProject(request, currentUserService.requireAuthenticatedUser());
    }

    @PostMapping("/{projectId}/invite")
    public void inviteMember(@PathVariable UUID projectId, @Valid @RequestBody ProjectRequests.InviteMemberRequest request) {
        projectService.inviteMember(projectId, request, currentUserService.requireAuthenticatedUser());
    }
}
