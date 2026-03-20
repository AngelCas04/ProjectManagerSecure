package com.projectmanager.platform.api;

import com.projectmanager.platform.service.CalendarService;
import com.projectmanager.platform.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
public class CalendarController {

    private final CalendarService calendarService;
    private final CurrentUserService currentUserService;

    public CalendarController(CalendarService calendarService, CurrentUserService currentUserService) {
        this.calendarService = calendarService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    public ViewModels.CalendarEntryView createEvent(@Valid @RequestBody CalendarRequests.CreateCalendarEntryRequest request) {
        return calendarService.createEvent(request, currentUserService.requireAuthenticatedUser());
    }
}
