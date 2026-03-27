package com.projectmanager.platform.service;

import com.projectmanager.platform.api.ChatRequests;
import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.ChatMessage;
import com.projectmanager.platform.domain.ChatRoom;
import com.projectmanager.platform.domain.Project;
import com.projectmanager.platform.domain.RoleName;
import com.projectmanager.platform.domain.WorkGroup;
import com.projectmanager.platform.repository.AppUserRepository;
import com.projectmanager.platform.repository.ChatMessageRepository;
import com.projectmanager.platform.repository.ChatRoomRepository;
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

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private ChatRoomRepository chatRoomRepository;
    @Mock
    private WorkGroupRepository workGroupRepository;
    @Mock
    private WorkGroupMemberRepository workGroupMemberRepository;
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
        ViewMapper viewMapper = new ViewMapper(inputSanitizer, workGroupRepository);
        chatService = new ChatService(
            chatMessageRepository,
            chatRoomRepository,
            workGroupRepository,
            workGroupMemberRepository,
            appUserRepository,
            projectAccessService,
            viewMapper,
            auditService,
            inputSanitizer
        );
    }

    @Test
    void createRoomBuildsAProjectRoomForManagedTeam() {
        AuthenticatedUser currentUser = new AuthenticatedUser(
            UUID.randomUUID(),
            "valeria.ruiz@acme.dev",
            "Valeria Ruiz",
            RoleName.ADMINISTRADOR,
            "session-1",
            Instant.now()
        );

        AppUser owner = new AppUser();
        ReflectionTestUtils.setField(owner, "id", currentUser.userId());
        owner.setName(currentUser.displayName());
        owner.setEmail(currentUser.email());
        owner.setTeam("Platform Security");
        owner.setRole(RoleName.ADMINISTRADOR);
        owner.setEnabled(true);

        WorkGroup workGroup = new WorkGroup();
        ReflectionTestUtils.setField(workGroup, "id", UUID.randomUUID());
        workGroup.setName("Platform Security");
        workGroup.setOwner(owner);

        Project project = new Project();
        ReflectionTestUtils.setField(project, "id", UUID.randomUUID());
        project.setCode("PX-01");
        project.setName("North Star");
        project.setOwner(owner);

        when(appUserRepository.findById(currentUser.userId())).thenReturn(Optional.of(owner));
        when(workGroupRepository.findByOwnerId(owner.getId())).thenReturn(Optional.of(workGroup));
        when(projectAccessService.requireProjectAccess(project.getId(), currentUser)).thenReturn(project);
        when(chatRoomRepository.findByWorkGroupIdAndSlugIgnoreCase(any(UUID.class), anyString())).thenReturn(Optional.empty());
        when(chatRoomRepository.countByWorkGroupId(workGroup.getId())).thenReturn(0L);
        when(chatRoomRepository.save(any(ChatRoom.class))).thenAnswer(invocation -> {
            ChatRoom room = invocation.getArgument(0);
            ReflectionTestUtils.setField(room, "id", UUID.randomUUID());
            return room;
        });

        var roomView = chatService.createRoom(
            new ChatRequests.CreateRoomRequest(project.getId(), "War Room", "Sala de coordinacion principal"),
            currentUser
        );

        ArgumentCaptor<ChatRoom> roomCaptor = ArgumentCaptor.forClass(ChatRoom.class);
        verify(chatRoomRepository).save(roomCaptor.capture());

        assertThat(roomView.projectId()).isEqualTo(project.getId().toString());
        assertThat(roomView.workGroupId()).isEqualTo(workGroup.getId().toString());
        assertThat(roomView.name()).isEqualTo("War Room");
        assertThat(roomView.slug()).isEqualTo("px-01-war-room");
        assertThat(roomView.defaultRoom()).isFalse();
        assertThat(roomCaptor.getValue().getCode()).isEqualTo("ROOM-01");
        assertThat(roomCaptor.getValue().getDescription()).isEqualTo("Sala de coordinacion principal");
    }

    @Test
    void createMessagePersistsToTheSelectedRoom() {
        AuthenticatedUser currentUser = new AuthenticatedUser(
            UUID.randomUUID(),
            "sofia.campos@acme.dev",
            "Sofia Campos",
            RoleName.ADMINISTRADOR,
            "session-2",
            Instant.now()
        );

        AppUser persistedUser = new AppUser();
        ReflectionTestUtils.setField(persistedUser, "id", currentUser.userId());
        persistedUser.setName(currentUser.displayName());
        persistedUser.setEmail(currentUser.email());
        persistedUser.setTeam("Backend Delivery");
        persistedUser.setRole(RoleName.ADMINISTRADOR);
        persistedUser.setEnabled(true);

        WorkGroup workGroup = new WorkGroup();
        ReflectionTestUtils.setField(workGroup, "id", UUID.randomUUID());
        workGroup.setName("Backend Delivery");
        workGroup.setOwner(persistedUser);

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

        ChatRoom room = new ChatRoom();
        ReflectionTestUtils.setField(room, "id", UUID.randomUUID());
        room.setWorkGroup(workGroup);
        room.setProject(project);
        room.setCreatedBy(persistedUser);
        room.setCode("ROOM-01");
        room.setName("War Room");
        room.setDescription("Coordination room");
        room.setSlug("px-02-war-room");
        room.setDefaultRoom(false);

        when(appUserRepository.findById(currentUser.userId())).thenReturn(Optional.of(persistedUser));
        when(workGroupRepository.findByOwnerId(persistedUser.getId())).thenReturn(Optional.of(workGroup));
        when(chatRoomRepository.findById(any(UUID.class))).thenReturn(Optional.of(room));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            ReflectionTestUtils.setField(message, "id", UUID.randomUUID());
            ReflectionTestUtils.setField(message, "createdAt", Instant.parse("2026-03-26T10:00:00Z"));
            ReflectionTestUtils.setField(message, "updatedAt", Instant.parse("2026-03-26T10:00:00Z"));
            return message;
        });

        var view = chatService.createMessage(null, room.getId(), "  Ship it now  ", currentUser);

        ArgumentCaptor<ChatMessage> captor = ArgumentCaptor.forClass(ChatMessage.class);
        verify(chatMessageRepository).save(captor.capture());

        assertThat(view.projectId()).isEqualTo(project.getId().toString());
        assertThat(view.roomId()).isEqualTo(room.getId().toString());
        assertThat(view.roomName()).isEqualTo("War Room");
        assertThat(captor.getValue().getRoom()).isEqualTo(room);
        assertThat(captor.getValue().getChatTeam()).isEqualTo("Backend Delivery");
        assertThat(captor.getValue().getText()).isEqualTo("Ship it now");
    }

    @Test
    void listMessagesByRoomReturnsOnlyMatchingRoomMessages() {
        AuthenticatedUser currentUser = new AuthenticatedUser(
            UUID.randomUUID(),
            "diego.lara@acme.dev",
            "Diego Lara",
            RoleName.ADMINISTRADOR,
            "session-3",
            Instant.now()
        );

        AppUser persistedUser = new AppUser();
        ReflectionTestUtils.setField(persistedUser, "id", currentUser.userId());
        persistedUser.setName(currentUser.displayName());
        persistedUser.setEmail(currentUser.email());
        persistedUser.setTeam("Desktop Delivery");
        persistedUser.setRole(RoleName.ADMINISTRADOR);
        persistedUser.setEnabled(true);

        WorkGroup workGroup = new WorkGroup();
        ReflectionTestUtils.setField(workGroup, "id", UUID.randomUUID());
        workGroup.setName("Desktop Delivery");
        workGroup.setOwner(persistedUser);

        ChatRoom room = new ChatRoom();
        ReflectionTestUtils.setField(room, "id", UUID.randomUUID());
        room.setWorkGroup(workGroup);
        room.setCreatedBy(persistedUser);
        room.setCode("ROOM-02");
        room.setName("Ops");
        room.setDescription("Coordination room");
        room.setSlug("desktop-ops");
        room.setDefaultRoom(true);

        ChatMessage matching = new ChatMessage();
        ReflectionTestUtils.setField(matching, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(matching, "createdAt", Instant.parse("2026-03-26T12:15:00Z"));
        ReflectionTestUtils.setField(matching, "updatedAt", Instant.parse("2026-03-26T12:15:00Z"));
        matching.setRoom(room);
        matching.setProject(null);
        matching.setAuthor(persistedUser);
        matching.setChatTeam("Desktop Delivery");
        matching.setText("Hello team");

        when(appUserRepository.findById(currentUser.userId())).thenReturn(Optional.of(persistedUser));
        when(workGroupRepository.findByOwnerId(persistedUser.getId())).thenReturn(Optional.of(workGroup));
        when(chatRoomRepository.findById(any(UUID.class))).thenReturn(Optional.of(room));
        when(chatMessageRepository.findTop100ByRoomIdAndChatTeamOrderByCreatedAtAsc(room.getId(), "Desktop Delivery"))
            .thenReturn(List.of(matching));

        var messages = chatService.listMessagesByRoom(room.getId(), currentUser);

        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).roomId()).isEqualTo(room.getId().toString());
        assertThat(messages.get(0).text()).isEqualTo("Hello team");
    }
}
