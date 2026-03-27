package com.projectmanager.platform.service;

import com.projectmanager.platform.api.ViewModels;
import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.MembershipStatus;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.FORBIDDEN;

@ExtendWith(MockitoExtension.class)
class WorkGroupServiceTest {

    @Mock
    private WorkGroupRepository workGroupRepository;
    @Mock
    private WorkGroupMemberRepository workGroupMemberRepository;
    @Mock
    private AppUserRepository appUserRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private AuditService auditService;
    @Mock
    private TeamInvitationService teamInvitationService;

    private WorkGroupService workGroupService;

    @BeforeEach
    void setUp() {
        InputSanitizer inputSanitizer = new InputSanitizer();
        ViewMapper viewMapper = new ViewMapper(inputSanitizer, workGroupRepository);
        workGroupService = new WorkGroupService(
            workGroupRepository,
            workGroupMemberRepository,
            appUserRepository,
            projectRepository,
            viewMapper,
            auditService,
            inputSanitizer,
            teamInvitationService
        );
    }

    @Test
    void createWorkGroupRequiresAdministrator() {
        AuthenticatedUser currentUser = new AuthenticatedUser(
            UUID.randomUUID(),
            "member@acme.dev",
            "Member",
            RoleName.MIEMBRO_PROYECTO,
            "session-1",
            Instant.now()
        );

        assertThatThrownBy(() -> workGroupService.createWorkGroup(
            new com.projectmanager.platform.api.WorkGroupRequests.CreateWorkGroupRequest(
                "Platform Security",
                "Owners of security controls.",
                "Platform coordination",
                "Restricted",
                "Semanal",
                List.of()
            ),
            currentUser
        ))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
            .isEqualTo(FORBIDDEN);
    }

    @Test
    void ensurePrimaryWorkGroupMembershipCreatesGroupAndMembershipForUser() {
        AppUser user = new AppUser();
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        user.setName("Sofia Campos");
        user.setEmail("sofia.campos@acme.dev");
        user.setRole(RoleName.MIEMBRO_PROYECTO);
        user.setTeam("Unassigned");
        user.setEnabled(true);

        when(workGroupRepository.findByNameIgnoreCase("Backend Delivery")).thenReturn(Optional.empty());
        when(workGroupRepository.countBy()).thenReturn(0L);
        when(appUserRepository.findAllByEnabledTrueOrderByNameAsc()).thenReturn(List.of());
        when(workGroupRepository.save(any(WorkGroup.class))).thenAnswer(invocation -> {
            WorkGroup workGroup = invocation.getArgument(0);
            if (workGroup.getId() == null) {
                ReflectionTestUtils.setField(workGroup, "id", UUID.randomUUID());
            }
            return workGroup;
        });
        when(workGroupMemberRepository.findByWorkGroupIdAndUserId(any(UUID.class), any(UUID.class))).thenReturn(Optional.empty());
        when(workGroupMemberRepository.save(any(WorkGroupMember.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        workGroupService.ensurePrimaryWorkGroupMembership(user, " Backend Delivery ", false);

        ArgumentCaptor<WorkGroup> groupCaptor = ArgumentCaptor.forClass(WorkGroup.class);
        verify(workGroupRepository, atLeastOnce()).save(groupCaptor.capture());
        WorkGroup persistedGroup = groupCaptor.getAllValues().get(groupCaptor.getAllValues().size() - 1);
        assertThat(persistedGroup.getName()).isEqualTo("Backend Delivery");
        assertThat(persistedGroup.getCode()).startsWith("BACKEND-DELIVERY-001");
        assertThat(persistedGroup.getFocus()).isEqualTo("Backend Delivery");
        assertThat(persistedGroup.getVisibility()).isEqualTo("Restricted");
        assertThat(persistedGroup.getCadence()).isEqualTo("Semanal");

        ArgumentCaptor<WorkGroupMember> memberCaptor = ArgumentCaptor.forClass(WorkGroupMember.class);
        verify(workGroupMemberRepository).save(memberCaptor.capture());
        assertThat(memberCaptor.getValue().getRole()).isEqualTo(WorkGroupRoleName.MEMBER);
        assertThat(memberCaptor.getValue().getStatus()).isEqualTo(MembershipStatus.ACTIVE);
        assertThat(user.getTeam()).isEqualTo("Backend Delivery");
    }
}
