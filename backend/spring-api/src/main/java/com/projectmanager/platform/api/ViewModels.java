package com.projectmanager.platform.api;

import java.util.List;

public final class ViewModels {

    private ViewModels() {
    }

    public record SessionView(String id, long issuedAt) {
    }

    public record UserView(String id, String name, String role, String team, String email, String initials) {
    }

    public record AccessSignalView(String id, String title, String value, String note) {
    }

    public record UserDirectoryView(String id, String name, String email, String role, String team, String initials) {
    }

    public record WorkGroupMemberView(
        String userId,
        String name,
        String email,
        String role,
        String membershipRole,
        String team,
        String initials
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

    public record AuthView(SessionView session, UserView currentUser) {
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
        List<UserDirectoryView> userDirectory,
        List<AccessSignalView> accessFeed,
        List<String> workspaceHighlights,
        List<SecurityControlView> securityControls,
        List<String> pentestChecklist,
        List<ThreatMatrixView> threatMatrix
    ) {
    }
}
