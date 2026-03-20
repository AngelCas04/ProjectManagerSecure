package com.projectmanager.platform.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public final class WorkGroupRequests {

    private WorkGroupRequests() {
    }

    public record CreateWorkGroupRequest(
        @NotBlank @Size(max = 80) String name,
        @Size(max = 600) String description,
        @Size(max = 80) String focus,
        @Pattern(regexp = "Internal|Restricted|Confidential") String visibility,
        @Size(max = 60) String cadence,
        List<UUID> projectIds
    ) {
    }

    public record UpdateWorkGroupRequest(
        @NotBlank @Size(max = 80) String name,
        @Size(max = 600) String description,
        @Size(max = 80) String focus,
        @Pattern(regexp = "Internal|Restricted|Confidential") String visibility,
        @Size(max = 60) String cadence,
        List<UUID> projectIds
    ) {
    }

    public record AssignMemberRequest(
        @NotNull UUID userId,
        @NotBlank @Pattern(regexp = "LEAD|MEMBER") String role
    ) {
    }
}
