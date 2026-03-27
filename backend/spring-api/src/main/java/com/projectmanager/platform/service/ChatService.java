package com.projectmanager.platform.service;

import com.projectmanager.platform.api.ChatRequests;
import com.projectmanager.platform.api.ViewModels;
import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.ChatMessage;
import com.projectmanager.platform.domain.ChatRoom;
import com.projectmanager.platform.domain.MembershipStatus;
import com.projectmanager.platform.domain.Project;
import com.projectmanager.platform.domain.WorkGroup;
import com.projectmanager.platform.domain.WorkGroupMember;
import com.projectmanager.platform.repository.AppUserRepository;
import com.projectmanager.platform.repository.ChatMessageRepository;
import com.projectmanager.platform.repository.ChatRoomRepository;
import com.projectmanager.platform.repository.WorkGroupMemberRepository;
import com.projectmanager.platform.repository.WorkGroupRepository;
import com.projectmanager.platform.security.AuthenticatedUser;
import com.projectmanager.platform.security.InputSanitizer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final WorkGroupRepository workGroupRepository;
    private final WorkGroupMemberRepository workGroupMemberRepository;
    private final AppUserRepository appUserRepository;
    private final ProjectAccessService projectAccessService;
    private final ViewMapper viewMapper;
    private final AuditService auditService;
    private final InputSanitizer inputSanitizer;

    public ChatService(
        ChatMessageRepository chatMessageRepository,
        ChatRoomRepository chatRoomRepository,
        WorkGroupRepository workGroupRepository,
        WorkGroupMemberRepository workGroupMemberRepository,
        AppUserRepository appUserRepository,
        ProjectAccessService projectAccessService,
        ViewMapper viewMapper,
        AuditService auditService,
        InputSanitizer inputSanitizer
    ) {
        this.chatMessageRepository = chatMessageRepository;
        this.chatRoomRepository = chatRoomRepository;
        this.workGroupRepository = workGroupRepository;
        this.workGroupMemberRepository = workGroupMemberRepository;
        this.appUserRepository = appUserRepository;
        this.projectAccessService = projectAccessService;
        this.viewMapper = viewMapper;
        this.auditService = auditService;
        this.inputSanitizer = inputSanitizer;
    }

    @Transactional(readOnly = true)
    public String resolveChatTeam(AuthenticatedUser currentUser) {
        AppUser user = appUserRepository.findById(currentUser.userId())
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found."));
        return normalizeChatTeam(user.getTeam());
    }

    @Transactional(readOnly = true)
    public List<ViewModels.ChatRoomView> listVisibleRooms(AuthenticatedUser currentUser) {
        List<ChatRoom> rooms = chatRoomRepository.findByWorkGroupIdInOrderByDefaultRoomDescCreatedAtAsc(visibleWorkGroupIds(currentUser));
        return rooms.stream().map(viewMapper::toChatRoomView).toList();
    }

    @Transactional(readOnly = true)
    public List<ViewModels.ChatRoomView> listRooms(AuthenticatedUser currentUser) {
        return listVisibleRooms(currentUser);
    }

    @Transactional(readOnly = true)
    public UUID resolveSocketRoomId(UUID projectId, UUID roomId, AuthenticatedUser currentUser) {
        ChatRoom room = resolveMessageRoom(projectId, roomId, currentUser);
        if (room == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Unable to resolve a chat room for this project.");
        }
        return room.getId();
    }

    @Transactional(readOnly = true)
    public List<ViewModels.ChatMessageView> listMessages(List<UUID> projectIds, AuthenticatedUser currentUser) {
        if (projectIds.isEmpty()) {
            return List.of();
        }

        String chatTeam = resolveChatTeam(currentUser);
        List<ChatRoom> projectRooms = findProjectRooms(projectIds, currentUser);
        List<ChatMessage> messages = new ArrayList<>();
        if (!projectRooms.isEmpty()) {
            messages.addAll(chatMessageRepository.findTop100ByRoomIdInAndChatTeamOrderByCreatedAtAsc(
                projectRooms.stream().map(ChatRoom::getId).toList(),
                chatTeam
            ));
        }
        messages.addAll(chatMessageRepository.findTop100ByProjectIdInAndChatTeamAndRoomIsNullOrderByCreatedAtAsc(projectIds, chatTeam));
        return messages.stream()
            .sorted(Comparator.comparing(ChatMessage::getCreatedAt).thenComparing(ChatMessage::getId))
            .map(viewMapper::toChatView)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ViewModels.ChatMessageView> listMessagesByRoom(UUID roomId, AuthenticatedUser currentUser) {
        ChatRoom room = requireVisibleRoom(roomId, currentUser);
        return chatMessageRepository.findTop100ByRoomIdAndChatTeamOrderByCreatedAtAsc(room.getId(), resolveChatTeam(currentUser)).stream()
            .map(viewMapper::toChatView)
            .toList();
    }

    @Transactional
    public ViewModels.ChatRoomView createRoom(ChatRequests.CreateRoomRequest request, AuthenticatedUser currentUser) {
        AppUser owner = requireAdminUser(currentUser);
        WorkGroup workGroup = ownedGroupOrThrow(owner);
        Project project = request.projectId() == null ? null : projectAccessService.requireProjectAccess(request.projectId(), currentUser);

        String name = sanitizeRoomName(request.name());
        String baseSlug = buildRoomSlug(name);
        String slug = project == null ? baseSlug : buildRoomSlug(project.getCode() + "-" + baseSlug);
        if (chatRoomRepository.findByWorkGroupIdAndSlugIgnoreCase(workGroup.getId(), slug).isPresent()) {
            throw new ResponseStatusException(CONFLICT, "A room with that name already exists in this team.");
        }

        ChatRoom room = new ChatRoom();
        room.setWorkGroup(workGroup);
        room.setProject(project);
        room.setCreatedBy(owner);
        room.setName(name);
        room.setCode(nextRoomCode(workGroup));
        room.setSlug(slug);
        room.setDescription(inputSanitizer.sanitizeMultilineText(request.description()));
        room.setDefaultRoom(false);

        room = chatRoomRepository.save(room);
        auditService.record(null, "Chat", currentUser.displayName(), "Created chat room " + room.getName() + ".");
        return viewMapper.toChatRoomView(room);
    }

    @Transactional
    public ViewModels.ChatRoomView ensureDefaultProjectRoom(Project project, AuthenticatedUser currentUser) {
        ChatRoom room = resolveOrCreateDefaultProjectRoom(project, currentUser);
        return room == null ? null : viewMapper.toChatRoomView(room);
    }

    @Transactional
    public ViewModels.ChatMessageView createMessage(UUID projectId, UUID roomId, String text, AuthenticatedUser currentUser) {
        AppUser author = appUserRepository.findById(currentUser.userId())
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found."));

        ChatRoom room = resolveMessageRoom(projectId, roomId, currentUser);
        Project project = projectId != null ? projectAccessService.requireProjectAccess(projectId, currentUser) : null;

        ChatMessage message = new ChatMessage();
        message.setRoom(room);
        message.setProject(project != null ? project : room != null ? room.getProject() : null);
        message.setAuthor(author);
        message.setChatTeam(normalizeChatTeam(room != null ? room.getWorkGroup().getName() : author.getTeam()));
        message.setText(inputSanitizer.sanitizeMultilineText(text));
        chatMessageRepository.save(message);

        if (message.getProject() != null) {
            auditService.record(message.getProject(), "Chat", currentUser.displayName(), "Posted a message in chat.");
        }
        return viewMapper.toChatView(message);
    }

    private ChatRoom resolveMessageRoom(UUID projectId, UUID roomId, AuthenticatedUser currentUser) {
        if (roomId != null) {
            return requireVisibleRoom(roomId, currentUser);
        }

        if (projectId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "roomId or projectId is required.");
        }

        Project project = projectAccessService.requireProjectAccess(projectId, currentUser);
        return resolveOrCreateDefaultProjectRoom(project, currentUser);
    }

    private List<ChatRoom> findProjectRooms(Collection<UUID> projectIds, AuthenticatedUser currentUser) {
        return chatRoomRepository.findByProjectIdIn(projectIds).stream()
            .filter(room -> hasAccessToWorkGroup(room.getWorkGroup(), currentUser))
            .toList();
    }

    private ChatRoom requireVisibleRoom(UUID roomId, AuthenticatedUser currentUser) {
        ChatRoom room = chatRoomRepository.findById(roomId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Chat room not found."));
        if (!hasAccessToWorkGroup(room.getWorkGroup(), currentUser)) {
            throw new ResponseStatusException(FORBIDDEN, "Chat room access denied.");
        }
        return room;
    }

    private ChatRoom resolveOrCreateDefaultProjectRoom(Project project, AuthenticatedUser currentUser) {
        WorkGroup workGroup = resolveProjectWorkGroup(project, currentUser);
        if (workGroup == null) {
            return null;
        }

        return chatRoomRepository.findByProjectIdAndWorkGroupIdAndDefaultRoomTrue(project.getId(), workGroup.getId())
            .orElseGet(() -> {
                ChatRoom room = new ChatRoom();
                room.setWorkGroup(workGroup);
                room.setProject(project);
                room.setCreatedBy(project.getOwner());
                room.setCode(nextRoomCode(workGroup));
                room.setName(project.getName() + " Chat");
                room.setSlug(buildRoomSlug(project.getCode() + "-chat"));
                room.setDescription("Sala principal del proyecto.");
                room.setDefaultRoom(true);
                return chatRoomRepository.save(room);
            });
    }

    private WorkGroup resolveProjectWorkGroup(Project project, AuthenticatedUser currentUser) {
        List<WorkGroup> groups = workGroupRepository.findByProjectsId(project.getId());
        if (groups.isEmpty()) {
            return ownedGroupOrNull(currentUser);
        }

        return groups.stream()
            .filter(group -> hasAccessToWorkGroup(group, currentUser))
            .findFirst()
            .orElse(groups.get(0));
    }

    private List<UUID> visibleWorkGroupIds(AuthenticatedUser currentUser) {
        if (currentUser.isAdmin()) {
            WorkGroup ownedGroup = ownedGroupOrNull(currentUser);
            return ownedGroup == null ? List.of() : List.of(ownedGroup.getId());
        }

        return workGroupMemberRepository.findByUserIdAndStatus(currentUser.userId(), MembershipStatus.ACTIVE)
            .stream()
            .map(WorkGroupMember::getWorkGroup)
            .map(WorkGroup::getId)
            .distinct()
            .toList();
    }

    private boolean hasAccessToWorkGroup(WorkGroup workGroup, AuthenticatedUser currentUser) {
        if (currentUser.isAdmin()) {
            WorkGroup ownedGroup = ownedGroupOrNull(currentUser);
            return ownedGroup != null && ownedGroup.getId().equals(workGroup.getId());
        }

        return workGroupMemberRepository.findByWorkGroupIdAndUserId(workGroup.getId(), currentUser.userId())
            .filter(member -> member.getStatus() == MembershipStatus.ACTIVE)
            .isPresent();
    }

    private AppUser requireAdminUser(AuthenticatedUser currentUser) {
        if (!currentUser.isAdmin()) {
            throw new ResponseStatusException(FORBIDDEN, "Only administrators can manage chat rooms.");
        }
        return appUserRepository.findById(currentUser.userId())
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found."));
    }

    private WorkGroup ownedGroupOrThrow(AppUser owner) {
        return workGroupRepository.findByOwnerId(owner.getId())
            .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Create your managed team before adding chat rooms."));
    }

    private WorkGroup ownedGroupOrNull(AuthenticatedUser currentUser) {
        return workGroupRepository.findByOwnerId(currentUser.userId()).orElse(null);
    }

    private String normalizeChatTeam(String team) {
        String sanitized = inputSanitizer.sanitizePlainText(team);
        return sanitized.isBlank() ? "General Delivery" : sanitized;
    }

    private String sanitizeRoomName(String value) {
        String sanitized = inputSanitizer.sanitizePlainText(value);
        if (sanitized.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Room name is required.");
        }
        return sanitized;
    }

    private String buildRoomSlug(String value) {
        String normalized = sanitizeRoomName(value)
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("^-+|-+$", "");
        return normalized.isBlank() ? "general" : normalized;
    }

    private String nextRoomCode(WorkGroup workGroup) {
        return "ROOM-" + String.format("%02d", chatRoomRepository.countByWorkGroupId(workGroup.getId()) + 1);
    }
}
