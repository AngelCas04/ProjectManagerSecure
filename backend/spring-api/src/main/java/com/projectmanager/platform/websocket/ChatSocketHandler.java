package com.projectmanager.platform.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectmanager.platform.api.ChatRequests;
import com.projectmanager.platform.api.ViewModels;
import com.projectmanager.platform.security.AuthenticatedUser;
import com.projectmanager.platform.service.ChatService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ChatService chatService;
    private final Map<ChatRoomKey, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    public ChatSocketHandler(ChatService chatService) {
        this.chatService = chatService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        AuthenticatedUser user = authenticatedUser(session);
        ChatRoomKey roomKey = resolveRoomKey(session.getUri(), user);

        session.getAttributes().put("roomId", roomKey.roomId());
        roomSessions.computeIfAbsent(roomKey, ignored -> ConcurrentHashMap.newKeySet()).add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        AuthenticatedUser user = authenticatedUser(session);
        UUID boundRoomId = (UUID) session.getAttributes().get("roomId");
        ChatRequests.SocketIncomingMessage payload = objectMapper.readValue(message.getPayload(), ChatRequests.SocketIncomingMessage.class);
        UUID requestedRoomId = payload.roomId() != null ? payload.roomId() : boundRoomId;

        if (requestedRoomId == null) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        UUID resolvedRoomId = chatService.resolveSocketRoomId(payload.projectId(), requestedRoomId, user);
        if (!resolvedRoomId.equals(boundRoomId)) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        ViewModels.ChatMessageView saved = chatService.createMessage(payload.projectId(), requestedRoomId, payload.text(), user);
        broadcast(new ChatRoomKey(boundRoomId), objectMapper.writeValueAsString(saved));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Object roomId = session.getAttributes().get("roomId");
        if (roomId instanceof UUID id) {
            ChatRoomKey roomKey = new ChatRoomKey(id);
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

    private ChatRoomKey resolveRoomKey(URI uri, AuthenticatedUser user) {
        UUID roomId = null;
        UUID projectId = null;
        if (uri != null && uri.getQuery() != null) {
            for (String pair : uri.getQuery().split("&")) {
                String[] parts = pair.split("=", 2);
                if (parts.length == 2 && "roomId".equals(parts[0])) {
                    roomId = UUID.fromString(parts[1]);
                } else if (parts.length == 2 && "projectId".equals(parts[0])) {
                    projectId = UUID.fromString(parts[1]);
                }
            }
        }

        UUID resolvedRoomId = chatService.resolveSocketRoomId(projectId, roomId, user);
        return new ChatRoomKey(resolvedRoomId);
    }

    private record ChatRoomKey(UUID roomId) {
    }
}
