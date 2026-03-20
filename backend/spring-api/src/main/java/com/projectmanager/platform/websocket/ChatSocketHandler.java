package com.projectmanager.platform.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectmanager.platform.api.ChatRequests;
import com.projectmanager.platform.api.ViewModels;
import com.projectmanager.platform.security.AuthenticatedUser;
import com.projectmanager.platform.service.ChatService;
import com.projectmanager.platform.service.ProjectAccessService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ChatService chatService;
    private final ProjectAccessService projectAccessService;
    private final Map<ChatRoomKey, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    public ChatSocketHandler(ChatService chatService, ProjectAccessService projectAccessService) {
        this.chatService = chatService;
        this.projectAccessService = projectAccessService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        AuthenticatedUser user = authenticatedUser(session);
        UUID projectId = projectId(session.getUri());
        String chatTeam = chatService.resolveChatTeam(user);
        projectAccessService.requireProjectAccess(projectId, user);

        session.getAttributes().put("projectId", projectId);
        session.getAttributes().put("chatTeam", chatTeam);
        roomSessions.computeIfAbsent(new ChatRoomKey(projectId, chatTeam), ignored -> ConcurrentHashMap.newKeySet()).add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        AuthenticatedUser user = authenticatedUser(session);
        UUID boundProjectId = (UUID) session.getAttributes().get("projectId");
        String boundChatTeam = (String) session.getAttributes().get("chatTeam");
        ChatRequests.SocketIncomingMessage payload = objectMapper.readValue(message.getPayload(), ChatRequests.SocketIncomingMessage.class);
        String currentChatTeam = chatService.resolveChatTeam(user);

        if (!boundProjectId.equals(payload.projectId()) || !Objects.equals(boundChatTeam, currentChatTeam)) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        ViewModels.ChatMessageView saved = chatService.createMessage(payload.projectId(), payload.text(), user);
        broadcast(new ChatRoomKey(boundProjectId, boundChatTeam), objectMapper.writeValueAsString(saved));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Object projectId = session.getAttributes().get("projectId");
        Object chatTeam = session.getAttributes().get("chatTeam");
        if (projectId instanceof UUID id && chatTeam instanceof String team) {
            ChatRoomKey roomKey = new ChatRoomKey(id, team);
            Set<WebSocketSession> sessions = roomSessions.get(roomKey);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    roomSessions.remove(roomKey);
                }
            }
        }
    }

    private void broadcast(ChatRoomKey roomKey, String payload) throws Exception {
        Set<WebSocketSession> sessions = roomSessions.getOrDefault(roomKey, Set.of());
        for (WebSocketSession target : sessions) {
            if (target.isOpen()) {
                target.sendMessage(new TextMessage(payload));
            }
        }
    }

    private AuthenticatedUser authenticatedUser(WebSocketSession session) throws Exception {
        if (session.getPrincipal() instanceof Authentication authentication
            && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return user;
        }
        session.close(CloseStatus.NOT_ACCEPTABLE);
        throw new IllegalStateException("WebSocket unauthenticated.");
    }

    private UUID projectId(URI uri) {
        if (uri == null || uri.getQuery() == null) {
            throw new IllegalArgumentException("Missing projectId.");
        }
        for (String pair : uri.getQuery().split("&")) {
            String[] parts = pair.split("=", 2);
            if (parts.length == 2 && "projectId".equals(parts[0])) {
                return UUID.fromString(parts[1]);
            }
        }
        throw new IllegalArgumentException("Missing projectId.");
    }

    private record ChatRoomKey(UUID projectId, String chatTeam) {
    }
}
