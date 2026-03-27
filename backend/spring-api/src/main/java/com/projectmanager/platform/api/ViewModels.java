package com.projectmanager.platform.api;

import java.util.List;

public final class ViewModels {

    private ViewModels() {
    }

    public record SessionView(String id, long issuedAt) {
    }

    public record RecoveryKitView(String passphrase, String title, String message) {
    }

    public record UserView(
        String id,
        String name,
        String role,
        String team,
        String email,
        String initials,
        String avatarUrl,
        boolean canManageMembers,
        boolean needsTeamSetup,
        String ownedWorkGroupId
    ) {
    }

    public record AccessSignalView(String id, String title, String value, String note) {
    }

    public record UserDirectoryView(String id, String name, String email, String role, String team, String initials, String avatarUrl) {
    }

    public record WorkGroupMemberView(
        String userId,
        String name,
        String email,
        String role,
        String membershipRole,
        String team,
        String initials,
        String avatarUrl
    ) {
    }

    public record TeamInvitationView(
        String id,
        String email,
        String status,
        long sentAt,
        long expiresAt
    ) {
    }

    public record ManagedTeamView(
        WorkGroupView team,
        List<TeamInvitationView> invitations
    ) {
    }

    public record TeamInvitationPreviewView(
        boolean valid,
        String email,
        String teamName,
        String inviterName,
        boolean existingAccount,
        String message
    ) {
    }

    public record WorkGroupView(
        String id,
        String code,
        String name,
        String description,
        String ownerId,
        String ownerName,
        String focus,
        String visibility,
        String cadence,
        List<String> projectIds,
        long members,
        List<WorkGroupMemberView> roster
    ) {
    }

    public record ChatRoomView(
        String id,
        String workGroupId,
        String projectId,
        String name,
        String description,
        String slug,
        boolean defaultRoom
    ) {
    }

    public record SecurityControlView(String title, String body) {
    }

    public record ThreatMatrixView(String threat, String defense) {
    }

    public record ProjectView(
        String id,
        String code,
        String name,
        String domain,
        String summary,
        String lead,
        String risk,
        String classification,
        String permissions,
        long members,
        String dueDate
    ) {
    }

    public record TaskView(
        String id,
        String projectId,
        String title,
        String description,
        String priority,
        String status,
        String dueDate,
        String assignee
    ) {
    }

    public record CalendarEntryView(
        String id,
        String projectId,
        String date,
        String time,
        String title,
        String type,
        String owner
    ) {
    }

    public record ChatMessageView(
        String id,
        String projectId,
        String roomId,
        String roomName,
        String author,
        String role,
        String time,
        String text
    ) {
    }

    public record TimelineEntryView(
        String id,
        String projectId,
        String date,
        String scope,
        String actor,
        String description
    ) {
    }

    public record AuthView(SessionView session, UserView currentUser, RecoveryKitView recoveryKit) {
    }

    public record PasswordRecoveryRequestView(String message) {
    }

    public record PasswordResetTokenView(boolean valid, String message) {
    }

    public record BootstrapView(
        SessionView session,
        UserView currentUser,
        List<ProjectView> projects,
        List<TaskView> tasks,
        List<CalendarEntryView> events,
        List<ChatMessageView> messages,
        List<TimelineEntryView> timeline,
        List<WorkGroupView> workGroups,
        List<ChatRoomView> chatRooms,
        List<UserDirectoryView> userDirectory,
        List<AccessSignalView> accessFeed,
        List<String> workspaceHighlights,
        List<SecurityControlView> securityControls,
        List<String> pentestChecklist,
        List<ThreatMatrixView> threatMatrix
    ) {
    }
}
