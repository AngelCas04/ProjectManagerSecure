package com.projectmanager.platform.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public final class ChatRequests {

    private ChatRequests() {
    }

    public record CreateMessageRequest(
        UUID projectId,
        UUID roomId,
        @NotBlank @Size(max = 400) String text
    ) {
    }

    public record CreateRoomRequest(
        @NotNull UUID projectId,
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 400) String description
    ) {
    }

    public record SocketIncomingMessage(
        UUID projectId,
        UUID roomId,
        @NotBlank @Size(max = 400) String text
    ) {
    }
}
