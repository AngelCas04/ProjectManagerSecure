package com.projectmanager.platform.api;

import com.projectmanager.platform.service.ChatService;
import com.projectmanager.platform.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final ChatService chatService;
    private final CurrentUserService currentUserService;

    public MessageController(ChatService chatService, CurrentUserService currentUserService) {
        this.chatService = chatService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    public ViewModels.ChatMessageView createMessage(@Valid @RequestBody ChatRequests.CreateMessageRequest request) {
        return chatService.createMessage(request.projectId(), request.text(), currentUserService.requireAuthenticatedUser());
    }
}
