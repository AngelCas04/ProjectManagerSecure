package com.projectmanager.platform.service;

import com.projectmanager.platform.api.ViewModels;
import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.MembershipStatus;
import com.projectmanager.platform.domain.Project;
import com.projectmanager.platform.domain.WorkGroup;
import com.projectmanager.platform.domain.WorkGroupMember;
import com.projectmanager.platform.repository.AppUserRepository;
import com.projectmanager.platform.repository.AuditEventRepository;
import com.projectmanager.platform.repository.CalendarEntryRepository;
import com.projectmanager.platform.repository.LoginAttemptRepository;
import com.projectmanager.platform.repository.ProjectMemberRepository;
import com.projectmanager.platform.repository.RefreshTokenRepository;
import com.projectmanager.platform.repository.TaskItemRepository;
import com.projectmanager.platform.repository.WorkGroupMemberRepository;
import com.projectmanager.platform.repository.WorkGroupRepository;
import com.projectmanager.platform.security.AuthenticatedUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class BootstrapService {

    private final ProjectAccessService projectAccessService;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskItemRepository taskItemRepository;
    private final CalendarEntryRepository calendarEntryRepository;
    private final AuditEventRepository auditEventRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AppUserRepository appUserRepository;
    private final WorkGroupRepository workGroupRepository;
    private final WorkGroupMemberRepository workGroupMemberRepository;
    private final ChatService chatService;
    private final ViewMapper viewMapper;

    public BootstrapService(
        ProjectAccessService projectAccessService,
        ProjectMemberRepository projectMemberRepository,
        TaskItemRepository taskItemRepository,
        CalendarEntryRepository calendarEntryRepository,
        AuditEventRepository auditEventRepository,
        LoginAttemptRepository loginAttemptRepository,
        RefreshTokenRepository refreshTokenRepository,
        AppUserRepository appUserRepository,
        WorkGroupRepository workGroupRepository,
        WorkGroupMemberRepository workGroupMemberRepository,
        ChatService chatService,
        ViewMapper viewMapper
    ) {
        this.projectAccessService = projectAccessService;
        this.projectMemberRepository = projectMemberRepository;
        this.taskItemRepository = taskItemRepository;
        this.calendarEntryRepository = calendarEntryRepository;
        this.auditEventRepository = auditEventRepository;
        this.loginAttemptRepository = loginAttemptRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.appUserRepository = appUserRepository;
        this.workGroupRepository = workGroupRepository;
        this.workGroupMemberRepository = workGroupMemberRepository;
        this.chatService = chatService;
        this.viewMapper = viewMapper;
    }

    @Transactional
    public ViewModels.BootstrapView bootstrap(AuthenticatedUser user) {
        AppUser persistedUser = appUserRepository.findById(user.userId())
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found."));

        List<Project> projects = projectAccessService.accessibleProjects(user);
        List<java.util.UUID> projectIds = projects.stream().map(Project::getId).toList();

        List<ViewModels.ProjectView> projectViews = projects.stream()
            .map(project -> viewMapper.toProjectView(project, projectMemberRepository.countByProjectIdAndStatus(project.getId(), MembershipStatus.ACTIVE)))
            .toList();

        List<ViewModels.TaskView> taskViews = projectIds.isEmpty() ? List.of() : taskItemRepository.findByProjectIdInOrderByDueDateAsc(projectIds)
            .stream()
            .map(viewMapper::toTaskView)
            .toList();

        List<ViewModels.CalendarEntryView> eventViews = projectIds.isEmpty() ? List.of() : calendarEntryRepository.findByProjectIdInOrderByDateAscTimeAsc(projectIds)
            .stream()
            .map(viewMapper::toCalendarView)
            .toList();

        List<ViewModels.ChatMessageView> messageViews = chatService.listMessages(projectIds, user);
        List<ViewModels.ChatRoomView> chatRoomViews = chatService.listRooms(user);

        List<ViewModels.TimelineEntryView> timelineViews = projectIds.isEmpty() ? List.of() : auditEventRepository.findTop200ByProjectIdInOrderByCreatedAtDesc(projectIds)
            .stream()
            .map(viewMapper::toTimelineView)
            .toList();

        List<WorkGroup> workGroups = user.isAdmin()
            ? workGroupRepository.findByOwnerId(user.userId()).map(List::of).orElse(List.of())
            : workGroupMemberRepository.findByUserIdAndStatus(user.userId(), MembershipStatus.ACTIVE)
                .stream()
                .map(WorkGroupMember::getWorkGroup)
                .distinct()
                .sorted(java.util.Comparator.comparing(WorkGroup::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        List<ViewModels.WorkGroupView> workGroupViews = workGroups.stream()
            .map(workGroup -> viewMapper.toWorkGroupView(
                workGroup,
                workGroupMemberRepository.findByWorkGroupIdAndStatusOrderByCreatedAtAsc(workGroup.getId(), MembershipStatus.ACTIVE)
            ))
            .toList();

        List<ViewModels.UserDirectoryView> userDirectoryViews;
        if (user.isAdmin()) {
            Set<java.util.UUID> visibleUserIds = new LinkedHashSet<>();
            visibleUserIds.add(user.userId());
            visibleUserIds.addAll(workGroupMemberRepository.findByWorkGroupIdInAndStatus(
                    workGroups.stream().map(WorkGroup::getId).toList(),
                    MembershipStatus.ACTIVE
                ).stream()
                .map(member -> member.getUser().getId())
                .toList());
            userDirectoryViews = appUserRepository.findByIdInAndEnabledTrueOrderByNameAsc(visibleUserIds)
                .stream()
                .map(viewMapper::toUserDirectoryView)
                .toList();
        } else if (workGroups.isEmpty()) {
            userDirectoryViews = appUserRepository.findByIdInAndEnabledTrueOrderByNameAsc(List.of(user.userId()))
                .stream()
                .map(viewMapper::toUserDirectoryView)
                .toList();
        } else {
            Set<java.util.UUID> visibleUserIds = new LinkedHashSet<>();
            visibleUserIds.add(user.userId());
            visibleUserIds.addAll(workGroupMemberRepository.findByWorkGroupIdInAndStatus(
                    workGroups.stream().map(WorkGroup::getId).toList(),
                    MembershipStatus.ACTIVE
                ).stream()
                .map(member -> member.getUser().getId())
                .toList());
            userDirectoryViews = appUserRepository.findByIdInAndEnabledTrueOrderByNameAsc(visibleUserIds)
                .stream()
                .map(viewMapper::toUserDirectoryView)
                .toList();
        }

        Instant since = Instant.now().minusSeconds(86400);
        List<ViewModels.AccessSignalView> accessFeed = List.of(
            new ViewModels.AccessSignalView("ACC-01", "Failed sign-ins blocked", String.valueOf(loginAttemptRepository.countFailedSince(since)), "Rate limiting and account lockout keep brute force noise contained."),
            new ViewModels.AccessSignalView("ACC-02", "Verified active sessions", String.valueOf(refreshTokenRepository.countByExpiresAtAfterAndRevokedAtIsNull(Instant.now())), "Only managed devices can reach restricted projects."),
            new ViewModels.AccessSignalView("ACC-03", "Audited changes today", String.valueOf(auditEventRepository.countSince(since)), "Timeline events are ready to flow into SIEM tooling.")
        );

        return new ViewModels.BootstrapView(
            viewMapper.toSessionView(user),
            viewMapper.toUserView(persistedUser),
            projectViews,
            taskViews,
            eventViews,
            messageViews,
            timelineViews,
            workGroupViews,
            chatRoomViews,
            userDirectoryViews,
            accessFeed,
            List.of(
                "Security by design across every screen",
                "Cookie-first session model ready for Spring Security",
                "Kanban, chat, calendar, audit and project control in one workspace"
            ),
            List.of(
                new ViewModels.SecurityControlView("Session model", "The UI is designed for HttpOnly, Secure, SameSite cookies instead of browser storage tokens."),
                new ViewModels.SecurityControlView("Input hygiene", "Forms normalize text, limit length and never render user supplied HTML."),
                new ViewModels.SecurityControlView("Zero trust UX", "Routes reflect role boundaries and sensitive actions stay explicit and auditable."),
                new ViewModels.SecurityControlView("Transport assumptions", "API calls are ready for HTTPS only backends with strict CORS and short lived JWT rotation.")
            ),
            List.of(
                "JWT access token with short expiry and secure refresh flow",
                "Strict CSP, HSTS and frame protection at edge or backend layer",
                "Rate limits on auth, invitation, chat upload and search endpoints",
                "Prepared statements only and strict validation on every payload",
                "No AWS keys or database secrets embedded in desktop or web clients",
                "Signed desktop updates with checksum verification before install"
            ),
            List.of(
                new ViewModels.ThreatMatrixView("XSS", "Plain text rendering, sanitization helpers, CSP in production and no dangerous HTML injection."),
                new ViewModels.ThreatMatrixView("Token theft", "Cookie based sessions, no localStorage token cache and backend controlled rotation."),
                new ViewModels.ThreatMatrixView("Privilege escalation", "Role aware screens in the client plus final authorization at API level."),
                new ViewModels.ThreatMatrixView("Brute force", "Lockout signals, rate limiting and audit surface for suspicious sign-in attempts.")
            )
        );
    }
}
