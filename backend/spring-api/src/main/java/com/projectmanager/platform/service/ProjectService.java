package com.projectmanager.platform.service;

import com.projectmanager.platform.api.ProjectRequests;
import com.projectmanager.platform.api.ViewModels;
import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.MembershipStatus;
import com.projectmanager.platform.domain.Project;
import com.projectmanager.platform.domain.ProjectMember;
import com.projectmanager.platform.domain.ProjectRoleName;
import com.projectmanager.platform.repository.AppUserRepository;
import com.projectmanager.platform.repository.ProjectMemberRepository;
import com.projectmanager.platform.repository.ProjectRepository;
import com.projectmanager.platform.security.AuthenticatedUser;
import com.projectmanager.platform.security.InputSanitizer;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.time.Instant;
import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final AppUserRepository appUserRepository;
    private final ProjectAccessService projectAccessService;
    private final ProjectParticipantService projectParticipantService;
    private final WorkGroupService workGroupService;
    private final ChatService chatService;
    private final ViewMapper viewMapper;
    private final AuditService auditService;
    private final InputSanitizer inputSanitizer;

    public ProjectService(
        ProjectRepository projectRepository,
        ProjectMemberRepository projectMemberRepository,
        AppUserRepository appUserRepository,
        ProjectAccessService projectAccessService,
        ProjectParticipantService projectParticipantService,
        WorkGroupService workGroupService,
        ChatService chatService,
        ViewMapper viewMapper,
        AuditService auditService,
        InputSanitizer inputSanitizer
    ) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.appUserRepository = appUserRepository;
        this.projectAccessService = projectAccessService;
        this.projectParticipantService = projectParticipantService;
        this.workGroupService = workGroupService;
        this.chatService = chatService;
        this.viewMapper = viewMapper;
        this.auditService = auditService;
        this.inputSanitizer = inputSanitizer;
    }

    public List<ViewModels.ProjectView> listProjects(AuthenticatedUser user) {
        return projectAccessService.accessibleProjects(user).stream()
            .map(project -> viewMapper.toProjectView(project, projectMemberRepository.countByProjectIdAndStatus(project.getId(), MembershipStatus.ACTIVE)))
            .toList();
    }

    public ViewModels.ProjectView createProject(ProjectRequests.CreateProjectRequest request, AuthenticatedUser user) {
        AppUser owner = appUserRepository.findById(user.userId())
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found."));

        Project project = new Project();
        project.setCode(buildProjectCode());
        project.setName(inputSanitizer.sanitizePlainText(request.name()));
        project.setDomain(inputSanitizer.sanitizePlainText(request.domain()));
        project.setSummary(inputSanitizer.sanitizeMultilineText(request.summary()));
        project.setLead(projectParticipantService.resolveManagedLead(owner, request.lead()));
        project.setRisk(inputSanitizer.sanitizePlainText(request.risk()));
        project.setClassification(inputSanitizer.sanitizePlainText(request.classification()));
        project.setPermissions("RBAC + policy approval");
        project.setDueDate(request.dueDate());
        project.setOwner(owner);
        projectRepository.save(project);

        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(owner);
        member.setRole(ProjectRoleName.OWNER);
        member.setStatus(MembershipStatus.ACTIVE);
        projectMemberRepository.save(member);
        workGroupService.linkProjectToUserGroups(project, owner);
        chatService.ensureDefaultProjectRoom(
            project,
            new AuthenticatedUser(owner.getId(), owner.getEmail(), owner.getName(), owner.getRole(), "project-create", Instant.now())
        );

        auditService.record(project, "Project", owner.getName(), "Created project " + project.getName() + ".");
        return viewMapper.toProjectView(project, 1);
    }

    public void inviteMember(UUID projectId, ProjectRequests.InviteMemberRequest request, AuthenticatedUser user) {
        Project project = projectAccessService.requireProjectAccess(projectId, user);
        AppUser target = appUserRepository.findByEmail(inputSanitizer.normalizeEmail(request.email()))
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Target user not found."));

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, target.getId())
            .orElseGet(ProjectMember::new);
        member.setProject(project);
        member.setUser(target);
        member.setRole(ProjectRoleName.valueOf(request.role()));
        member.setStatus(MembershipStatus.ACTIVE);
        projectMemberRepository.save(member);
        workGroupService.linkProjectToUserGroups(project, target);

        auditService.record(project, "Project", user.displayName(), "Granted project access to " + target.getName() + ".");
    }

    private String buildProjectCode() {
        long next = projectRepository.countBy() + 1;
        return "PX-" + String.format("%02d", next);
    }
}
