package com.projectmanager.platform.service;

import com.projectmanager.platform.api.ViewModels;
import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.AuditEvent;
import com.projectmanager.platform.domain.CalendarEntry;
import com.projectmanager.platform.domain.ChatMessage;
import com.projectmanager.platform.domain.ChatRoom;
import com.projectmanager.platform.domain.Project;
import com.projectmanager.platform.domain.RoleName;
import com.projectmanager.platform.domain.TaskItem;
import com.projectmanager.platform.domain.WorkGroup;
import com.projectmanager.platform.domain.WorkGroupInvitation;
import com.projectmanager.platform.domain.WorkGroupMember;
import com.projectmanager.platform.security.AuthenticatedUser;
import com.projectmanager.platform.security.InputSanitizer;
import com.projectmanager.platform.repository.WorkGroupRepository;
import org.springframework.stereotype.Component;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class ViewMapper {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    private final InputSanitizer inputSanitizer;
    private final WorkGroupRepository workGroupRepository;

    public ViewMapper(InputSanitizer inputSanitizer, WorkGroupRepository workGroupRepository) {
        this.inputSanitizer = inputSanitizer;
        this.workGroupRepository = workGroupRepository;
    }

    public ViewModels.SessionView toSessionView(AuthenticatedUser user) {
        return new ViewModels.SessionView(user.sessionId(), user.issuedAt().toEpochMilli());
    }

    public ViewModels.UserView toUserView(AuthenticatedUser user) {
        String ownedWorkGroupId = workGroupRepository.findByOwnerId(user.userId())
            .map(group -> group.getId().toString())
            .orElse(null);
        return new ViewModels.UserView(
            user.userId().toString(),
            user.displayName(),
            roleLabel(user.role()),
            "",
            user.email(),
            inputSanitizer.toInitials(user.displayName()),
            null,
            user.isAdmin(),
            user.isAdmin() && ownedWorkGroupId == null,
            ownedWorkGroupId
        );
    }

    public ViewModels.UserView toUserView(AppUser user) {
        String ownedWorkGroupId = workGroupRepository.findByOwnerId(user.getId())
            .map(group -> group.getId().toString())
            .orElse(null);
        return new ViewModels.UserView(
            user.getId().toString(),
            user.getName(),
            roleLabel(user.getRole()),
            user.getTeam(),
            user.getEmail(),
            inputSanitizer.toInitials(user.getName()),
            user.getAvatarUrl(),
            user.getRole() == RoleName.ADMINISTRADOR,
            user.getRole() == RoleName.ADMINISTRADOR && ownedWorkGroupId == null,
            ownedWorkGroupId
        );
    }

    public ViewModels.UserDirectoryView toUserDirectoryView(AppUser user) {
        return new ViewModels.UserDirectoryView(
            user.getId().toString(),
            user.getName(),
            user.getEmail(),
            roleLabel(user.getRole()),
            user.getTeam(),
            inputSanitizer.toInitials(user.getName()),
            user.getAvatarUrl()
        );
    }

    public ViewModels.WorkGroupMemberView toWorkGroupMemberView(WorkGroupMember membership) {
        AppUser user = membership.getUser();
        return new ViewModels.WorkGroupMemberView(
            user.getId().toString(),
            user.getName(),
            user.getEmail(),
            roleLabel(user.getRole()),
            membership.getRole().name(),
            user.getTeam(),
            inputSanitizer.toInitials(user.getName()),
            user.getAvatarUrl()
        );
    }

    public ViewModels.ChatRoomView toChatRoomView(ChatRoom room) {
        return new ViewModels.ChatRoomView(
            room.getId().toString(),
            room.getWorkGroup().getId().toString(),
            room.getProject() == null ? null : room.getProject().getId().toString(),
            room.getName(),
            room.getDescription(),
            room.getSlug(),
            room.isDefaultRoom()
        );
    }

    public ViewModels.TeamInvitationView toTeamInvitationView(WorkGroupInvitation invitation) {
        return new ViewModels.TeamInvitationView(
            invitation.getId().toString(),
            invitation.getEmail(),
            invitation.getAcceptedAt() != null ? "ACCEPTED" : invitation.getRevokedAt() != null ? "REVOKED" : "PENDING",
            invitation.getCreatedAt().toEpochMilli(),
            invitation.getExpiresAt().toEpochMilli()
        );
    }

    public ViewModels.WorkGroupView toWorkGroupView(WorkGroup workGroup, List<WorkGroupMember> memberships) {
        return new ViewModels.WorkGroupView(
            workGroup.getId().toString(),
            workGroup.getCode(),
            workGroup.getName(),
            workGroup.getDescription(),
            workGroup.getOwner() == null ? null : workGroup.getOwner().getId().toString(),
            workGroup.getOwner() == null ? "" : workGroup.getOwner().getName(),
            workGroup.getFocus(),
            workGroup.getVisibility(),
            workGroup.getCadence(),
            workGroup.getProjects().stream().map(project -> project.getId().toString()).toList(),
            memberships.size(),
            memberships.stream()
                .map(this::toWorkGroupMemberView)
                .toList()
        );
    }

    public ViewModels.ProjectView toProjectView(Project project, long members) {
        return new ViewModels.ProjectView(
            project.getId().toString(),
            project.getCode(),
            project.getName(),
            project.getDomain(),
            project.getSummary(),
            project.getLead(),
            project.getRisk(),
            project.getClassification(),
            project.getPermissions(),
            members,
            DATE_FORMAT.format(project.getDueDate())
        );
    }

    public ViewModels.TaskView toTaskView(TaskItem task) {
        return new ViewModels.TaskView(
            task.getId().toString(),
            task.getProject().getId().toString(),
            task.getTitle(),
            task.getDescription(),
            enumTitle(task.getPriority().name()),
            task.getStatus().name(),
            DATE_FORMAT.format(task.getDueDate()),
            task.getAssignee()
        );
    }

    public ViewModels.CalendarEntryView toCalendarView(CalendarEntry event) {
        return new ViewModels.CalendarEntryView(
            event.getId().toString(),
            event.getProject().getId().toString(),
            DATE_FORMAT.format(event.getDate()),
            TIME_FORMAT.format(event.getTime()),
            event.getTitle(),
            enumTitle(event.getType().name()),
            event.getOwner()
        );
    }

    public ViewModels.ChatMessageView toChatView(ChatMessage message) {
        return new ViewModels.ChatMessageView(
            message.getId().toString(),
            message.getProject() == null ? null : message.getProject().getId().toString(),
            message.getRoom() == null ? null : message.getRoom().getId().toString(),
            message.getRoom() == null ? null : message.getRoom().getName(),
            message.getAuthor().getName(),
            roleLabel(message.getAuthor().getRole()),
            TIME_FORMAT.format(message.getCreatedAt().atZone(ZoneOffset.UTC).toLocalTime()),
            message.getText()
        );
    }

    public ViewModels.TimelineEntryView toTimelineView(AuditEvent event) {
        return new ViewModels.TimelineEntryView(
            event.getId().toString(),
            event.getProject() == null ? "global" : event.getProject().getId().toString(),
            DATE_FORMAT.format(event.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate()),
            event.getScope(),
            event.getActor(),
            event.getDescription()
        );
    }

    public String roleLabel(RoleName role) {
        return role == RoleName.ADMINISTRADOR ? "Administrador" : "Miembro del proyecto";
    }

    private String enumTitle(String value) {
        return switch (value) {
            case "LOW" -> "Low";
            case "MEDIUM" -> "Medium";
            case "HIGH" -> "High";
            case "CRITICAL" -> "Critical";
            case "MEETING" -> "Meeting";
            case "DEADLINE" -> "Deadline";
            case "REVIEW" -> "Review";
            case "RELEASE" -> "Release";
            default -> value;
        };
    }
}
