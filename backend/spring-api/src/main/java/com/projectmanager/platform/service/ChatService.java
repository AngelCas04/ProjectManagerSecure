package com.projectmanager.platform.service;

import com.projectmanager.platform.api.ViewModels;
import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.ChatMessage;
import com.projectmanager.platform.domain.Project;
import com.projectmanager.platform.repository.AppUserRepository;
import com.projectmanager.platform.repository.ChatMessageRepository;
import com.projectmanager.platform.security.AuthenticatedUser;
import com.projectmanager.platform.security.InputSanitizer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final AppUserRepository appUserRepository;
    private final ProjectAccessService projectAccessService;
    private final ViewMapper viewMapper;
    private final AuditService auditService;
    private final InputSanitizer inputSanitizer;

    public ChatService(
        ChatMessageRepository chatMessageRepository,
        AppUserRepository appUserRepository,
        ProjectAccessService projectAccessService,
        ViewMapper viewMapper,
        AuditService auditService,
        InputSanitizer inputSanitizer
    ) {
        this.chatMessageRepository = chatMessageRepository;
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
    public List<ViewModels.ChatMessageView> listMessages(List<UUID> projectIds, AuthenticatedUser currentUser) {
        if (projectIds.isEmpty()) {
            return List.of();
        }

        String chatTeam = resolveChatTeam(currentUser);
        return chatMessageRepository.findTop100ByProjectIdInAndChatTeamOrderByCreatedAtAsc(projectIds, chatTeam)
            .stream()
            .map(viewMapper::toChatView)
            .toList();
    }

    @Transactional
    public ViewModels.ChatMessageView createMessage(UUID projectId, String text, AuthenticatedUser currentUser) {
        Project project = projectAccessService.requireProjectAccess(projectId, currentUser);
        AppUser author = appUserRepository.findById(currentUser.userId())
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found."));

        ChatMessage message = new ChatMessage();
        message.setProject(project);
        message.setAuthor(author);
        message.setChatTeam(normalizeChatTeam(author.getTeam()));
        message.setText(inputSanitizer.sanitizeMultilineText(text));
        chatMessageRepository.save(message);

        auditService.record(project, "Chat", currentUser.displayName(), "Posted a message in team chat.");
        return viewMapper.toChatView(message);
    }

    private String normalizeChatTeam(String team) {
        String sanitized = inputSanitizer.sanitizePlainText(team);
        return sanitized.isBlank() ? "General Delivery" : sanitized;
    }
}
