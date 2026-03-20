package com.projectmanager.platform.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public final class ChatRequests {

    private ChatRequests() {
    }

    public record CreateMessageRequest(
        @NotNull UUID projectId,
        @NotBlank @Size(max = 400) String text
    ) {
    }

    public record SocketIncomingMessage(
        @NotNull UUID projectId,
        @NotBlank @Size(max = 400) String text
    ) {
    }
}
