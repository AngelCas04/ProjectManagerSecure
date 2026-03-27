package com.projectmanager.platform.service;

import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.MembershipStatus;
import com.projectmanager.platform.domain.Project;
import com.projectmanager.platform.domain.WorkGroup;
import com.projectmanager.platform.repository.ProjectMemberRepository;
import com.projectmanager.platform.repository.WorkGroupMemberRepository;
import com.projectmanager.platform.repository.WorkGroupRepository;
import com.projectmanager.platform.security.InputSanitizer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class ProjectParticipantService {

    private final WorkGroupRepository workGroupRepository;
    private final WorkGroupMemberRepository workGroupMemberRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final InputSanitizer inputSanitizer;

    public ProjectParticipantService(
        WorkGroupRepository workGroupRepository,
        WorkGroupMemberRepository workGroupMemberRepository,
        ProjectMemberRepository projectMemberRepository,
        InputSanitizer inputSanitizer
    ) {
        this.workGroupRepository = workGroupRepository;
        this.workGroupMemberRepository = workGroupMemberRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.inputSanitizer = inputSanitizer;
    }

    @Transactional(readOnly = true)
    public String resolveManagedLead(AppUser actor, String rawValue) {
        String normalized = normalize(rawValue);
        if (normalized.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Lead is required.");
        }

        Map<String, AppUser> membersByKey = new LinkedHashMap<>();
        workGroupRepository.findByOwnerId(actor.getId()).ifPresent(group -> {
            workGroupMemberRepository.findByWorkGroupIdAndStatusOrderByCreatedAtAsc(group.getId(), MembershipStatus.ACTIVE)
                .forEach(member -> register(membersByKey, member.getUser()));
        });

        register(membersByKey, actor);
        AppUser matched = membersByKey.get(normalized);
        if (matched == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Select a lead who belongs to your team.");
        }
        return matched.getName();
    }

    @Transactional(readOnly = true)
    public String resolveProjectParticipant(Project project, String rawValue, String fieldLabel) {
        String normalized = normalize(rawValue);
        if (normalized.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, fieldLabel + " is required.");
        }

        AppUser matched = participantsByKey(project).get(normalized);
        if (matched == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Select a " + fieldLabel.toLowerCase(Locale.ROOT) + " who belongs to the project team.");
        }
        return matched.getName();
    }

    @Transactional(readOnly = true)
    public List<String> participantNames(Project project) {
        return participantsByKey(project).values().stream()
            .map(AppUser::getName)
            .distinct()
            .toList();
    }

    private Map<String, AppUser> participantsByKey(Project project) {
        Map<String, AppUser> participants = new LinkedHashMap<>();
        List<WorkGroup> linkedGroups = workGroupRepository.findByProjectsId(project.getId());

        if (!linkedGroups.isEmpty()) {
            for (WorkGroup group : linkedGroups) {
                workGroupMemberRepository.findByWorkGroupIdAndStatusOrderByCreatedAtAsc(group.getId(), MembershipStatus.ACTIVE)
                    .forEach(member -> register(participants, member.getUser()));
            }
        }

        if (participants.isEmpty()) {
            projectMemberRepository.findByProjectIdAndStatus(project.getId(), MembershipStatus.ACTIVE)
                .forEach(member -> register(participants, member.getUser()));
        }

        if (participants.isEmpty() && project.getOwner() != null) {
            register(participants, project.getOwner());
        }

        return participants;
    }

    private void register(Map<String, AppUser> participants, AppUser user) {
        if (user == null) {
            return;
        }

        String normalizedEmail = inputSanitizer.normalizeEmail(user.getEmail());
        String normalizedName = normalize(user.getName());
        if (!normalizedEmail.isBlank()) {
          participants.putIfAbsent(normalizedEmail, user);
        }
        if (!normalizedName.isBlank()) {
            participants.putIfAbsent(normalizedName, user);
        }
    }

    private String normalize(String value) {
        return inputSanitizer.sanitizePlainText(value).trim().toLowerCase(Locale.ROOT);
    }
}
