package com.projectmanager.platform.api;

import com.projectmanager.platform.service.CurrentUserService;
import com.projectmanager.platform.service.WorkGroupService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workgroups")
public class WorkGroupController {

    private final WorkGroupService workGroupService;
    private final CurrentUserService currentUserService;

    public WorkGroupController(WorkGroupService workGroupService, CurrentUserService currentUserService) {
        this.workGroupService = workGroupService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<ViewModels.WorkGroupView> listWorkGroups() {
        return workGroupService.listWorkGroups(currentUserService.requireAuthenticatedUser());
    }

    @GetMapping("/directory")
    public List<ViewModels.UserDirectoryView> listDirectory() {
        return workGroupService.listDirectory(currentUserService.requireAuthenticatedUser());
    }

    @PostMapping
    public ViewModels.WorkGroupView createWorkGroup(@Valid @RequestBody WorkGroupRequests.CreateWorkGroupRequest request) {
        return workGroupService.createWorkGroup(request, currentUserService.requireAuthenticatedUser());
    }

    @GetMapping("/managed")
    public ViewModels.ManagedTeamView managedTeam() {
        return workGroupService.managedTeam(currentUserService.requireAuthenticatedUser());
    }

    @PostMapping("/managed/setup")
    public ViewModels.ManagedTeamView setupManagedTeam(@Valid @RequestBody WorkGroupRequests.TeamSetupRequest request) {
        return workGroupService.setupManagedTeam(request, currentUserService.requireAuthenticatedUser());
    }

    @PostMapping("/managed/invitations")
    public ViewModels.ManagedTeamView inviteManagedTeamMembers(@Valid @RequestBody WorkGroupRequests.InviteMembersRequest request) {
        return workGroupService.inviteManagedTeamMembers(request, currentUserService.requireAuthenticatedUser());
    }

    @DeleteMapping("/managed/invitations/{invitationId}")
    public ViewModels.ManagedTeamView revokeManagedTeamInvitation(@PathVariable UUID invitationId) {
        return workGroupService.revokeManagedTeamInvitation(invitationId, currentUserService.requireAuthenticatedUser());
    }

    @GetMapping("/invitations/preview")
    public ViewModels.TeamInvitationPreviewView previewInvitation(@RequestParam String token) {
        return workGroupService.previewInvitation(token);
    }

    @PostMapping("/invitations/accept")
    public void acceptInvitation(@Valid @RequestBody WorkGroupRequests.AcceptInvitationRequest request) {
        workGroupService.acceptInvitation(request.token(), currentUserService.requireAuthenticatedUser());
    }

    @PutMapping("/{workGroupId}")
    public ViewModels.WorkGroupView updateWorkGroup(
        @PathVariable UUID workGroupId,
        @Valid @RequestBody WorkGroupRequests.UpdateWorkGroupRequest request
    ) {
        return workGroupService.updateWorkGroup(workGroupId, request, currentUserService.requireAuthenticatedUser());
    }

    @PostMapping("/{workGroupId}/members")
    public ViewModels.WorkGroupView assignMember(
        @PathVariable UUID workGroupId,
        @Valid @RequestBody WorkGroupRequests.AssignMemberRequest request
    ) {
        return workGroupService.assignMember(workGroupId, request, currentUserService.requireAuthenticatedUser());
    }

    @DeleteMapping("/{workGroupId}/members/{userId}")
    public ViewModels.WorkGroupView removeMember(@PathVariable UUID workGroupId, @PathVariable UUID userId) {
        return workGroupService.removeMember(workGroupId, userId, currentUserService.requireAuthenticatedUser());
    }
}
