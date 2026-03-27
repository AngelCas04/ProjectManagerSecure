package com.projectmanager.platform.api;

import com.projectmanager.platform.service.ChatService;
import com.projectmanager.platform.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final ChatService chatService;
    private final CurrentUserService currentUserService;

    public MessageController(ChatService chatService, CurrentUserService currentUserService) {
        this.chatService = chatService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/rooms")
    public List<ViewModels.ChatRoomView> listRooms() {
        return chatService.listRooms(currentUserService.requireAuthenticatedUser());
    }

    @PostMapping("/rooms")
    public ViewModels.ChatRoomView createRoom(@Valid @RequestBody ChatRequests.CreateRoomRequest request) {
        return chatService.createRoom(request, currentUserService.requireAuthenticatedUser());
    }

    @PostMapping
    public ViewModels.ChatMessageView createMessage(@Valid @RequestBody ChatRequests.CreateMessageRequest request) {
        return chatService.createMessage(request.projectId(), request.roomId(), request.text(), currentUserService.requireAuthenticatedUser());
    }

    @GetMapping
    public List<ViewModels.ChatMessageView> listMessages(
        @RequestParam(required = false) UUID projectId,
        @RequestParam(required = false) UUID roomId
    ) {
        if (roomId != null) {
            return chatService.listMessagesByRoom(roomId, currentUserService.requireAuthenticatedUser());
        }

        if (projectId == null) {
            return List.of();
        }

        return chatService.listMessages(List.of(projectId), currentUserService.requireAuthenticatedUser());
    }
}
