package com.projectmanager.platform.service;

import com.projectmanager.platform.api.CalendarRequests;
import com.projectmanager.platform.api.ViewModels;
import com.projectmanager.platform.domain.CalendarEntry;
import com.projectmanager.platform.domain.EventType;
import com.projectmanager.platform.domain.Project;
import com.projectmanager.platform.repository.CalendarEntryRepository;
import com.projectmanager.platform.security.AuthenticatedUser;
import com.projectmanager.platform.security.InputSanitizer;
import org.springframework.stereotype.Service;

@Service
public class CalendarService {

    private final CalendarEntryRepository calendarEntryRepository;
    private final ProjectAccessService projectAccessService;
    private final ProjectParticipantService projectParticipantService;
    private final ViewMapper viewMapper;
    private final AuditService auditService;
    private final InputSanitizer inputSanitizer;

    public CalendarService(
        CalendarEntryRepository calendarEntryRepository,
        ProjectAccessService projectAccessService,
        ProjectParticipantService projectParticipantService,
        ViewMapper viewMapper,
        AuditService auditService,
        InputSanitizer inputSanitizer
    ) {
        this.calendarEntryRepository = calendarEntryRepository;
        this.projectAccessService = projectAccessService;
        this.projectParticipantService = projectParticipantService;
        this.viewMapper = viewMapper;
        this.auditService = auditService;
        this.inputSanitizer = inputSanitizer;
    }

    public ViewModels.CalendarEntryView createEvent(CalendarRequests.CreateCalendarEntryRequest request, AuthenticatedUser user) {
        Project project = projectAccessService.requireProjectAccess(request.projectId(), user);

        CalendarEntry entry = new CalendarEntry();
        entry.setProject(project);
        entry.setTitle(inputSanitizer.sanitizePlainText(request.title()));
        entry.setDate(request.date());
        entry.setTime(request.time());
        entry.setType(EventType.valueOf(request.type().toUpperCase()));
        entry.setOwner(projectParticipantService.resolveProjectParticipant(project, request.owner(), "Owner"));
        calendarEntryRepository.save(entry);

        auditService.record(project, "Calendar", user.displayName(), "Scheduled " + entry.getTitle() + ".");
        return viewMapper.toCalendarView(entry);
    }
}
