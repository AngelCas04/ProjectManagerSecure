package com.projectmanager.platform.api;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public final class CalendarRequests {

    private CalendarRequests() {
    }

    public record CreateCalendarEntryRequest(
        @NotNull UUID projectId,
        @NotBlank @Size(max = 120) String title,
        @NotNull @FutureOrPresent LocalDate date,
        @NotNull LocalTime time,
        @NotBlank @Pattern(regexp = "Meeting|Deadline|Review|Release") String type,
        @NotBlank @Size(max = 80) String owner
    ) {
    }
}
