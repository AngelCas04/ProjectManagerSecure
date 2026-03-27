package com.projectmanager.platform.service;

import com.projectmanager.platform.api.AuthRequests;
import com.projectmanager.platform.api.ViewModels;
import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.RoleName;
import com.projectmanager.platform.repository.AppUserRepository;
import com.projectmanager.platform.security.AuthenticatedUser;
import com.projectmanager.platform.security.InputSanitizer;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ProfileService {

    private final AppUserRepository appUserRepository;
    private final InputSanitizer inputSanitizer;
    private final ViewMapper viewMapper;
    private final AuditService auditService;
    private final WorkGroupService workGroupService;

    public ProfileService(
        AppUserRepository appUserRepository,
        InputSanitizer inputSanitizer,
        ViewMapper viewMapper,
        AuditService auditService,
        WorkGroupService workGroupService
    ) {
        this.appUserRepository = appUserRepository;
        this.inputSanitizer = inputSanitizer;
        this.viewMapper = viewMapper;
        this.auditService = auditService;
        this.workGroupService = workGroupService;
    }

    public ViewModels.UserView updateProfile(AuthRequests.UpdateProfileRequest request, AuthenticatedUser currentUser) {
        AppUser user = appUserRepository.findById(currentUser.userId())
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found."));

        String nextEmail = inputSanitizer.normalizeEmail(request.email());
        appUserRepository.findByEmail(nextEmail)
            .filter(existing -> !existing.getId().equals(user.getId()))
            .ifPresent(existing -> {
                throw new ResponseStatusException(CONFLICT, "Email already in use.");
            });

        String sanitizedName = inputSanitizer.sanitizePlainText(request.name());
        String sanitizedTeam = inputSanitizer.sanitizePlainText(request.team());
        if (sanitizedName.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Name is required.");
        }
        if (sanitizedTeam.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Team is required.");
        }

        user.setName(sanitizedName);
        user.setEmail(nextEmail);
        user.setAvatarUrl(sanitizeAvatarUrl(request.avatarUrl()));
        if (currentUser.isAdmin()) {
            user.setTeam(sanitizedTeam);
            user.setRole("Administrador".equals(request.role()) ? RoleName.ADMINISTRADOR : RoleName.MIEMBRO_PROYECTO);
        }

        appUserRepository.save(user);
        if (currentUser.isAdmin()) {
            workGroupService.ensurePrimaryWorkGroupMembership(user, sanitizedTeam);
        }
        auditService.record(null, "Profile", user.getName(), "Updated account profile preferences.");
        return viewMapper.toUserView(user);
    }

    private String sanitizeAvatarUrl(String avatarUrl) {
        if (avatarUrl == null || avatarUrl.isBlank()) {
            return null;
        }

        String trimmed = avatarUrl.trim();
        if (!trimmed.startsWith("data:image/")) {
            throw new ResponseStatusException(BAD_REQUEST, "Avatar image format is not supported.");
        }

        if (trimmed.length() > 200000) {
            throw new ResponseStatusException(BAD_REQUEST, "Avatar image is too large.");
        }

        return trimmed;
    }
}
