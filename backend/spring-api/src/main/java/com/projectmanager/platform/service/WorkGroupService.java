package com.projectmanager.platform.service;

import com.projectmanager.platform.api.ViewModels;
import com.projectmanager.platform.api.WorkGroupRequests;
import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.MembershipStatus;
import com.projectmanager.platform.domain.Project;
import com.projectmanager.platform.domain.RoleName;
import com.projectmanager.platform.domain.WorkGroup;
import com.projectmanager.platform.domain.WorkGroupMember;
import com.projectmanager.platform.domain.WorkGroupRoleName;
import com.projectmanager.platform.repository.AppUserRepository;
import com.projectmanager.platform.repository.ProjectRepository;
import com.projectmanager.platform.repository.WorkGroupMemberRepository;
import com.projectmanager.platform.repository.WorkGroupRepository;
import com.projectmanager.platform.security.AuthenticatedUser;
import com.projectmanager.platform.security.InputSanitizer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class WorkGroupService {

    private final WorkGroupRepository workGroupRepository;
    private final WorkGroupMemberRepository workGroupMemberRepository;
    private final AppUserRepository appUserRepository;
    private final ProjectRepository projectRepository;
    private final ViewMapper viewMapper;
    private final AuditService auditService;
    private final InputSanitizer inputSanitizer;

    public WorkGroupService(
        WorkGroupRepository workGroupRepository,
        WorkGroupMemberRepository workGroupMemberRepository,
        AppUserRepository appUserRepository,
        ProjectRepository projectRepository,
        ViewMapper viewMapper,
        AuditService auditService,
        InputSanitizer inputSanitizer
    ) {
        this.workGroupRepository = workGroupRepository;
        this.workGroupMemberRepository = workGroupMemberRepository;
        this.appUserRepository = appUserRepository;
        this.projectRepository = projectRepository;
        this.viewMapper = viewMapper;
        this.auditService = auditService;
        this.inputSanitizer = inputSanitizer;
    }

    @Transactional(readOnly = true)
    public List<ViewModels.WorkGroupView> listWorkGroups(AuthenticatedUser currentUser) {
        return accessibleGroups(currentUser).stream()
            .map(this::toWorkGroupView)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ViewModels.UserDirectoryView> listDirectory(AuthenticatedUser currentUser) {
        List<AppUser> users;
        if (currentUser.isAdmin()) {
            users = appUserRepository.findAllByEnabledTrueOrderByNameAsc();
        } else {
            List<UUID> groupIds = workGroupMemberRepository.findByUserIdAndStatus(currentUser.userId(), MembershipStatus.ACTIVE)
                .stream()
                .map(member -> member.getWorkGroup().getId())
                .toList();
            if (groupIds.isEmpty()) {
                users = appUserRepository.findByIdInAndEnabledTrueOrderByNameAsc(List.of(currentUser.userId()));
            } else {
                Set<UUID> userIds = workGroupMemberRepository.findByWorkGroupIdInAndStatus(groupIds, MembershipStatus.ACTIVE)
                    .stream()
                    .map(member -> member.getUser().getId())
                    .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
                userIds.add(currentUser.userId());
                users = appUserRepository.findByIdInAndEnabledTrueOrderByNameAsc(userIds);
            }
        }

        return users.stream()
            .map(viewMapper::toUserDirectoryView)
            .toList();
    }

    @Transactional
    public ViewModels.WorkGroupView createWorkGroup(WorkGroupRequests.CreateWorkGroupRequest request, AuthenticatedUser currentUser) {
        AppUser owner = requireAdminUser(currentUser);
        String name = sanitizeRequiredName(request.name(), "Group name");

        if (workGroupRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(CONFLICT, "A work group with that name already exists.");
        }

        WorkGroup workGroup = new WorkGroup();
        workGroup.setCode(nextGroupCode(name));
        workGroup.setName(name);
        workGroup.setDescription(sanitizeDescription(request.description()));
        workGroup.setFocus(sanitizeFocus(request.focus(), name));
        workGroup.setVisibility(normalizeVisibility(request.visibility()));
        workGroup.setCadence(sanitizeCadence(request.cadence()));
        workGroup.setOwner(owner);
        workGroup.setProjects(resolveProjects(request.projectIds()));
        workGroupRepository.save(workGroup);

        upsertMembership(workGroup, owner, WorkGroupRoleName.LEAD, MembershipStatus.ACTIVE);
        owner.setTeam(name);
        appUserRepository.save(owner);

        auditService.record(null, "WorkGroup", currentUser.displayName(), "Created work group " + workGroup.getName() + ".");
        return toWorkGroupView(workGroup);
    }

    @Transactional
    public ViewModels.WorkGroupView updateWorkGroup(UUID workGroupId, WorkGroupRequests.UpdateWorkGroupRequest request, AuthenticatedUser currentUser) {
        requireAdminUser(currentUser);
        WorkGroup workGroup = findGroup(workGroupId);
        String nextName = sanitizeRequiredName(request.name(), "Group name");

        workGroupRepository.findByNameIgnoreCase(nextName)
            .filter(existing -> !existing.getId().equals(workGroupId))
            .ifPresent(existing -> {
                throw new ResponseStatusException(CONFLICT, "A work group with that name already exists.");
            });

        String previousName = workGroup.getName();
        workGroup.setName(nextName);
        workGroup.setDescription(sanitizeDescription(request.description()));
        workGroup.setFocus(sanitizeFocus(request.focus(), nextName));
        workGroup.setVisibility(normalizeVisibility(request.visibility()));
        workGroup.setCadence(sanitizeCadence(request.cadence()));
        workGroup.setProjects(resolveProjects(request.projectIds()));
        workGroupRepository.save(workGroup);

        if (!previousName.equals(nextName)) {
            appUserRepository.findAll().stream()
                .filter(user -> previousName.equalsIgnoreCase(user.getTeam()))
                .forEach(user -> user.setTeam(nextName));
            appUserRepository.flush();
        }

        auditService.record(null, "WorkGroup", currentUser.displayName(), "Updated work group " + workGroup.getName() + ".");
        return toWorkGroupView(workGroup);
    }

    @Transactional
    public ViewModels.WorkGroupView assignMember(UUID workGroupId, WorkGroupRequests.AssignMemberRequest request, AuthenticatedUser currentUser) {
        requireAdminUser(currentUser);
        if (request.userId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "User id is required.");
        }

        WorkGroup workGroup = findGroup(workGroupId);
        AppUser target = appUserRepository.findById(request.userId())
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Target user not found."));

        WorkGroupRoleName role = WorkGroupRoleName.valueOf(request.role());
        upsertMembership(workGroup, target, role, MembershipStatus.ACTIVE);
        if (target.getTeam() == null || target.getTeam().isBlank()) {
            target.setTeam(workGroup.getName());
            appUserRepository.save(target);
        }

        auditService.record(null, "WorkGroup", currentUser.displayName(), "Assigned " + target.getName() + " to " + workGroup.getName() + ".");
        return toWorkGroupView(workGroup);
    }

    @Transactional
    public ViewModels.WorkGroupView removeMember(UUID workGroupId, UUID userId, AuthenticatedUser currentUser) {
        requireAdminUser(currentUser);
        WorkGroup workGroup = findGroup(workGroupId);
        WorkGroupMember membership = workGroupMemberRepository.findByWorkGroupIdAndUserId(workGroupId, userId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Membership not found."));

        if (workGroup.getOwner() != null && workGroup.getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(BAD_REQUEST, "Reassign the work group owner before removing that member.");
        }

        membership.setStatus(MembershipStatus.REVOKED);
        workGroupMemberRepository.save(membership);
        syncUserPrimaryTeamAfterRemoval(membership.getUser(), workGroup);

        auditService.record(null, "WorkGroup", currentUser.displayName(), "Removed " + membership.getUser().getName() + " from " + workGroup.getName() + ".");
        return toWorkGroupView(workGroup);
    }

    @Transactional
    public void ensurePrimaryWorkGroupMembership(AppUser user, String requestedTeam) {
        ensurePrimaryWorkGroupMembership(user, requestedTeam, user.getRole() == RoleName.ADMINISTRADOR, true);
    }

    @Transactional
    public void ensurePrimaryWorkGroupMembership(AppUser user, String requestedTeam, boolean leadMembership) {
        ensurePrimaryWorkGroupMembership(user, requestedTeam, leadMembership, true);
    }

    @Transactional
    public void ensureRegistrationMembership(AppUser user, String requestedTeam) {
        ensurePrimaryWorkGroupMembership(user, requestedTeam, false, false);
    }

    @Transactional
    public void linkProjectToUserGroups(Project project, AppUser user) {
        List<WorkGroup> userGroups = workGroupMemberRepository.findByUserIdAndStatus(user.getId(), MembershipStatus.ACTIVE)
            .stream()
            .map(WorkGroupMember::getWorkGroup)
            .distinct()
            .toList();

        for (WorkGroup workGroup : userGroups) {
            boolean alreadyLinked = workGroup.getProjects().stream()
                .anyMatch(existing -> existing.getId().equals(project.getId()));
            if (!alreadyLinked) {
                workGroup.getProjects().add(project);
                workGroupRepository.save(workGroup);
            }
        }
    }

    @Transactional
    public void ensurePrimaryWorkGroupMembership(AppUser user, String requestedTeam, boolean leadMembership, boolean allowRequestedGroupCreation) {
        String teamName = sanitizeOptionalName(requestedTeam);
        if (teamName.isBlank()) {
            teamName = defaultTeamName();
        }
        final String normalizedTeamName = teamName;

        WorkGroup workGroup = workGroupRepository.findByNameIgnoreCase(normalizedTeamName)
            .orElseGet(() -> allowRequestedGroupCreation
                ? createWorkGroupEntity(normalizedTeamName, user, leadMembership)
                : workGroupRepository.findByNameIgnoreCase(defaultTeamName())
                    .orElseGet(() -> createWorkGroupEntity(defaultTeamName(), user, false)));

        if (workGroup.getOwner() == null || leadMembership) {
            workGroup.setOwner(user);
            workGroupRepository.save(workGroup);
        }

        upsertMembership(workGroup, user, leadMembership ? WorkGroupRoleName.LEAD : WorkGroupRoleName.MEMBER, MembershipStatus.ACTIVE);
        user.setTeam(workGroup.getName());
        appUserRepository.save(user);
    }

    private AppUser requireAdminUser(AuthenticatedUser currentUser) {
        if (!currentUser.isAdmin()) {
            throw new ResponseStatusException(FORBIDDEN, "Administrator permissions required.");
        }

        return appUserRepository.findById(currentUser.userId())
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found."));
    }

    private List<WorkGroup> accessibleGroups(AuthenticatedUser currentUser) {
        if (currentUser.isAdmin()) {
            return workGroupRepository.findAllByOrderByNameAsc();
        }

        List<UUID> groupIds = workGroupMemberRepository.findByUserIdAndStatus(currentUser.userId(), MembershipStatus.ACTIVE)
            .stream()
            .map(member -> member.getWorkGroup().getId())
            .toList();

        return workGroupRepository.findAllById(groupIds).stream()
            .sorted(Comparator.comparing(WorkGroup::getName, String.CASE_INSENSITIVE_ORDER))
            .toList();
    }

    private WorkGroup findGroup(UUID workGroupId) {
        return workGroupRepository.findById(workGroupId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Work group not found."));
    }

    private WorkGroupMember upsertMembership(WorkGroup workGroup, AppUser user, WorkGroupRoleName role, MembershipStatus status) {
        WorkGroupMember member = workGroupMemberRepository.findByWorkGroupIdAndUserId(workGroup.getId(), user.getId())
            .orElseGet(WorkGroupMember::new);
        member.setWorkGroup(workGroup);
        member.setUser(user);
        member.setRole(role);
        member.setStatus(status);
        return workGroupMemberRepository.save(member);
    }

    private ViewModels.WorkGroupView toWorkGroupView(WorkGroup workGroup) {
        List<WorkGroupMember> memberships = workGroupMemberRepository.findByWorkGroupIdAndStatusOrderByCreatedAtAsc(workGroup.getId(), MembershipStatus.ACTIVE);
        return viewMapper.toWorkGroupView(workGroup, memberships);
    }

    private String sanitizeRequiredName(String value, String fieldName) {
        String sanitized = sanitizeOptionalName(value);
        if (sanitized.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, fieldName + " is required.");
        }
        return sanitized;
    }

    private String sanitizeOptionalName(String value) {
        return inputSanitizer.sanitizePlainText(value);
    }

    private String sanitizeDescription(String value) {
        return inputSanitizer.sanitizeMultilineText(value);
    }

    private String sanitizeFocus(String value, String fallbackName) {
        String sanitized = inputSanitizer.sanitizePlainText(value);
        if (!sanitized.isBlank()) {
            return sanitized;
        }
        return fallbackName;
    }

    private String sanitizeCadence(String value) {
        String sanitized = inputSanitizer.sanitizePlainText(value);
        return sanitized.isBlank() ? "Semanal" : sanitized;
    }

    private String normalizeVisibility(String value) {
        return switch (value) {
            case "Internal", "Confidential" -> value;
            default -> "Restricted";
        };
    }

    private List<Project> resolveProjects(List<UUID> requestedProjectIds) {
        if (requestedProjectIds == null || requestedProjectIds.isEmpty()) {
            return List.of();
        }

        List<Project> projects = projectRepository.findAllById(requestedProjectIds);
        if (projects.size() != requestedProjectIds.size()) {
            throw new ResponseStatusException(BAD_REQUEST, "One or more linked projects were not found.");
        }
        return projects;
    }

    private void syncUserPrimaryTeamAfterRemoval(AppUser user, WorkGroup removedGroup) {
        if (!sanitizeOptionalName(user.getTeam()).equalsIgnoreCase(removedGroup.getName())) {
            return;
        }

        String nextTeam = workGroupMemberRepository.findByUserIdAndStatus(user.getId(), MembershipStatus.ACTIVE).stream()
            .filter(member -> !member.getWorkGroup().getId().equals(removedGroup.getId()))
            .map(member -> member.getWorkGroup().getName())
            .findFirst()
            .orElse("Unassigned");
        user.setTeam(nextTeam);
        appUserRepository.save(user);
    }

    private String nextGroupCode(String name) {
        String normalized = sanitizeOptionalName(name)
            .toUpperCase(Locale.ROOT)
            .replaceAll("[^A-Z0-9]+", "-")
            .replaceAll("(^-|-$)", "");
        String prefix = normalized.isBlank() ? "GRP" : normalized;
        if (prefix.length() > 18) {
            prefix = prefix.substring(0, 18);
        }
        return prefix + "-" + String.format("%03d", workGroupRepository.countBy() + 1);
    }

    private AppUser findFallbackOwner() {
        return appUserRepository.findAllByEnabledTrueOrderByNameAsc().stream()
            .filter(user -> user.getRole() == RoleName.ADMINISTRADOR)
            .findFirst()
            .orElse(null);
    }

    private WorkGroup createWorkGroupEntity(String groupName, AppUser user, boolean leadMembership) {
        WorkGroup created = new WorkGroup();
        created.setCode(nextGroupCode(groupName));
        created.setName(groupName);
        created.setDescription("Equipo principal para coordinar el trabajo de " + groupName + ".");
        created.setFocus(groupName);
        created.setVisibility("Restricted");
        created.setCadence("Semanal");
        created.setOwner(leadMembership ? user : findFallbackOwner());
        return workGroupRepository.save(created);
    }

    private String defaultTeamName() {
        return "General Delivery";
    }
}
