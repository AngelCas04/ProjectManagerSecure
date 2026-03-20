package com.projectmanager.platform.service;

import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.ChatMessage;
import com.projectmanager.platform.domain.Project;
import com.projectmanager.platform.domain.RoleName;
import com.projectmanager.platform.repository.AppUserRepository;
import com.projectmanager.platform.repository.ChatMessageRepository;
import com.projectmanager.platform.security.AuthenticatedUser;
import com.projectmanager.platform.security.InputSanitizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private AppUserRepository appUserRepository;
    @Mock
    private ProjectAccessService projectAccessService;
    @Mock
    private AuditService auditService;

    private ChatService chatService;

    @BeforeEach
    void setUp() {
        InputSanitizer inputSanitizer = new InputSanitizer();
        ViewMapper viewMapper = new ViewMapper(inputSanitizer);
        chatService = new ChatService(
            chatMessageRepository,
            appUserRepository,
            projectAccessService,
            viewMapper,
            auditService,
            inputSanitizer
        );
    }

    @Test
    void createMessagePersistsCurrentUsersTeamAsChatRoom() {
        AuthenticatedUser currentUser = new AuthenticatedUser(
            UUID.randomUUID(),
            "sofia.campos@acme.dev",
            "Sofia Campos",
            RoleName.MIEMBRO_PROYECTO,
            "session-1",
            Instant.now()
        );

        AppUser persistedUser = new AppUser();
        ReflectionTestUtils.setField(persistedUser, "id", currentUser.userId());
        persistedUser.setName(currentUser.displayName());
        persistedUser.setEmail(currentUser.email());
        persistedUser.setTeam("Backend Delivery");
        persistedUser.setRole(RoleName.MIEMBRO_PROYECTO);
        persistedUser.setEnabled(true);

        Project project = new Project();
        ReflectionTestUtils.setField(project, "id", UUID.randomUUID());
        project.setCode("PX-02");
        project.setName("Sentinel API Gateway");
        project.setDomain("Backend");
        project.setSummary("Secure API gateway project.");
        project.setLead("Sofia Campos");
        project.setRisk("High");
        project.setClassification("Confidential");
        project.setPermissions("Private squad");
        project.setDueDate(LocalDate.now().plusDays(7));
        project.setOwner(persistedUser);

        when(projectAccessService.requireProjectAccess(any(UUID.class), any())).thenReturn(project);
        when(appUserRepository.findById(currentUser.userId())).thenReturn(Optional.of(persistedUser));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            ReflectionTestUtils.setField(message, "id", UUID.randomUUID());
            ReflectionTestUtils.setField(message, "createdAt", Instant.now());
            ReflectionTestUtils.setField(message, "updatedAt", Instant.now());
            return message;
        });

        var view = chatService.createMessage(project.getId(), "  Ship it now  ", currentUser);

        ArgumentCaptor<ChatMessage> captor = ArgumentCaptor.forClass(ChatMessage.class);
        verify(chatMessageRepository).save(captor.capture());

        assertThat(view.projectId()).isEqualTo(project.getId().toString());
        assertThat(captor.getValue().getChatTeam()).isEqualTo("Backend Delivery");
        assertThat(captor.getValue().getText()).isEqualTo("Ship it now");
    }

    @Test
    void listMessagesReturnsOnlyMatchingTeamMessages() {
        AuthenticatedUser currentUser = new AuthenticatedUser(
            UUID.randomUUID(),
            "diego.lara@acme.dev",
            "Diego Lara",
            RoleName.MIEMBRO_PROYECTO,
            "session-2",
            Instant.now()
        );

        AppUser persistedUser = new AppUser();
        ReflectionTestUtils.setField(persistedUser, "id", currentUser.userId());
        persistedUser.setName(currentUser.displayName());
        persistedUser.setEmail(currentUser.email());
        persistedUser.setTeam("Desktop Delivery");
        persistedUser.setRole(RoleName.MIEMBRO_PROYECTO);
        persistedUser.setEnabled(true);

        Project project = new Project();
        ReflectionTestUtils.setField(project, "id", UUID.randomUUID());
        project.setCode("PX-03");
        project.setName("Nova Desktop Client");
        project.setDomain("Desktop");
        project.setSummary("Desktop client project.");
        project.setLead("Diego Lara");
        project.setRisk("Low");
        project.setClassification("Internal");
        project.setPermissions("Team restricted");
        project.setDueDate(LocalDate.now().plusDays(14));
        project.setOwner(persistedUser);

        ChatMessage matching = new ChatMessage();
        ReflectionTestUtils.setField(matching, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(matching, "createdAt", Instant.now());
        ReflectionTestUtils.setField(matching, "updatedAt", Instant.now());
        matching.setProject(project);
        matching.setAuthor(persistedUser);
        matching.setChatTeam("Desktop Delivery");
        matching.setText("Hello team");

        ChatMessage differentTeam = new ChatMessage();
        ReflectionTestUtils.setField(differentTeam, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(differentTeam, "createdAt", Instant.now());
        ReflectionTestUtils.setField(differentTeam, "updatedAt", Instant.now());
        differentTeam.setProject(project);
        differentTeam.setAuthor(persistedUser);
        differentTeam.setChatTeam("Backend Delivery");
        differentTeam.setText("Hidden from other teams");

        when(appUserRepository.findById(currentUser.userId())).thenReturn(Optional.of(persistedUser));
        when(chatMessageRepository.findTop100ByProjectIdInAndChatTeamOrderByCreatedAtAsc(anyList(), anyString()))
            .thenReturn(List.of(matching));

        var messages = chatService.listMessages(List.of(project.getId()), currentUser);

        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).text()).isEqualTo("Hello team");
    }
}
