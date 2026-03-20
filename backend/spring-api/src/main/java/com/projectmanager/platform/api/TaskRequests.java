package com.projectmanager.platform.api;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public final class TaskRequests {

    private TaskRequests() {
    }

    public record CreateTaskRequest(
        @NotNull UUID projectId,
        @NotBlank @Size(max = 140) String title,
        @NotBlank @Size(max = 2000) String description,
        @NotBlank @Pattern(regexp = "Low|Medium|High|Critical") String priority,
        @NotBlank @Pattern(regexp = "TODO|IN_PROGRESS|DONE") String status,
        @NotNull @FutureOrPresent LocalDate dueDate,
        @NotBlank @Size(max = 80) String assignee
    ) {
    }

    public record UpdateTaskStatusRequest(
        @NotBlank @Pattern(regexp = "TODO|IN_PROGRESS|DONE") String status
    ) {
    }
}
