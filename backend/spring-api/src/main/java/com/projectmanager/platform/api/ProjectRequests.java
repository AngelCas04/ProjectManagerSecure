package com.projectmanager.platform.api;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public final class ProjectRequests {

    private ProjectRequests() {
    }

    public record CreateProjectRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 60) String domain,
        @NotBlank @Size(min = 20, max = 1200) String summary,
        @NotBlank @Size(max = 80) String lead,
        @NotBlank @Pattern(regexp = "Low|Medium|High") String risk,
        @NotBlank @Pattern(regexp = "Internal|Restricted|Confidential") String classification,
        @NotNull @FutureOrPresent LocalDate dueDate
    ) {
    }

    public record InviteMemberRequest(
        @NotBlank @Size(max = 190) String email,
        @NotBlank @Pattern(regexp = "OWNER|MAINTAINER|MEMBER|VIEWER") String role
    ) {
    }
}
