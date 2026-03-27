package com.projectmanager.platform.service;

import com.projectmanager.platform.api.ViewModels;
import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.MembershipStatus;
import com.projectmanager.platform.domain.WorkGroup;
import com.projectmanager.platform.domain.WorkGroupInvitation;
import com.projectmanager.platform.domain.WorkGroupRoleName;
import com.projectmanager.platform.repository.AppUserRepository;
import com.projectmanager.platform.repository.WorkGroupInvitationRepository;
import com.projectmanager.platform.repository.WorkGroupMemberRepository;
import com.projectmanager.platform.security.InputSanitizer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class TeamInvitationService {

    private static final long INVITATION_TTL_SECONDS = 604800;

    private final WorkGroupInvitationRepository workGroupInvitationRepository;
    private final WorkGroupMemberRepository workGroupMemberRepository;
    private final AppUserRepository appUserRepository;
    private final ViewMapper viewMapper;
    private final InputSanitizer inputSanitizer;
    private final InvitationEmailService invitationEmailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public TeamInvitationService(
        WorkGroupInvitationRepository workGroupInvitationRepository,
        WorkGroupMemberRepository workGroupMemberRepository,
        AppUserRepository appUserRepository,
        ViewMapper viewMapper,
        InputSanitizer inputSanitizer,
        InvitationEmailService invitationEmailService
    ) {
        this.workGroupInvitationRepository = workGroupInvitationRepository;
        this.workGroupMemberRepository = workGroupMemberRepository;
        this.appUserRepository = appUserRepository;
        this.viewMapper = viewMapper;
        this.inputSanitizer = inputSanitizer;
        this.invitationEmailService = invitationEmailService;
    }

    @Transactional(readOnly = true)
    public List<ViewModels.TeamInvitationView> listPendingInvitations(WorkGroup workGroup, AppUser currentUser) {
        requireOwnership(workGroup, currentUser);
        return workGroupInvitationRepository.findByWorkGroupIdAndAcceptedAtIsNullAndRevokedAtIsNullOrderByCreatedAtDesc(workGroup.getId()).stream()
            .filter(invitation -> invitation.getExpiresAt().isAfter(Instant.now()))
            .map(viewMapper::toTeamInvitationView)
            .toList();
    }

    @Transactional
    public List<ViewModels.TeamInvitationView> inviteMembers(WorkGroup workGroup, AppUser currentUser, List<String> emails) {
        requireOwnership(workGroup, currentUser);

        Set<String> normalizedEmails = new LinkedHashSet<>();
        for (String email : emails == null ? List.<String>of() : emails) {
            String normalized = inputSanitizer.normalizeEmail(email);
            if (!normalized.isBlank()) {
                normalizedEmails.add(normalized);
            }
        }

        if (normalizedEmails.isEmpty()) {
            return listPendingInvitations(workGroup, currentUser);
        }

        Set<String> activeMemberEmails = workGroupMemberRepository.findByWorkGroupIdAndStatusOrderByCreatedAtAsc(workGroup.getId(), MembershipStatus.ACTIVE).stream()
            .map(member -> member.getUser().getEmail())
            .map(inputSanitizer::normalizeEmail)
            .collect(java.util.stream.Collectors.toSet());

        List<ViewModels.TeamInvitationView> createdInvitations = new ArrayList<>();
        for (String email : normalizedEmails) {
            if (activeMemberEmails.contains(email)) {
                continue;
            }

            workGroupInvitationRepository.findByWorkGroupIdAndEmailIgnoreCaseAndAcceptedAtIsNullAndRevokedAtIsNull(workGroup.getId(), email)
                .ifPresent(existing -> {
                    existing.setRevokedAt(Instant.now());
                    workGroupInvitationRepository.save(existing);
                });

            WorkGroupInvitation invitation = new WorkGroupInvitation();
            String rawToken = randomToken();
            invitation.setWorkGroup(workGroup);
            invitation.setInvitedBy(currentUser);
            invitation.setEmail(email);
            invitation.setRole(WorkGroupRoleName.MEMBER.name());
            invitation.setTokenHash(hash(rawToken));
            invitation.setExpiresAt(Instant.now().plusSeconds(INVITATION_TTL_SECONDS));
            workGroupInvitationRepository.save(invitation);
            invitationEmailService.sendTeamInvitation(invitation, rawToken);
            createdInvitations.add(viewMapper.toTeamInvitationView(invitation));
        }

        return createdInvitations;
    }

    @Transactional
    public void revokeInvitation(WorkGroup workGroup, UUID invitationId, AppUser currentUser) {
        requireOwnership(workGroup, currentUser);
        WorkGroupInvitation invitation = workGroupInvitationRepository.findById(invitationId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Invitation not found."));
        if (!invitation.getWorkGroup().getId().equals(workGroup.getId())) {
            throw new ResponseStatusException(NOT_FOUND, "Invitation not found.");
        }
        invitation.setRevokedAt(Instant.now());
        workGroupInvitationRepository.save(invitation);
    }

    @Transactional(readOnly = true)
    public ViewModels.TeamInvitationPreviewView previewInvitation(String rawToken) {
        WorkGroupInvitation invitation = resolveInvitation(rawToken);
        if (invitation == null) {
            return new ViewModels.TeamInvitationPreviewView(false, "", "", "", false, "La invitacion ya no esta disponible.");
        }

        boolean existingAccount = appUserRepository.findByEmail(inputSanitizer.normalizeEmail(invitation.getEmail())).isPresent();
        return new ViewModels.TeamInvitationPreviewView(
            true,
            invitation.getEmail(),
            invitation.getWorkGroup().getName(),
            invitation.getInvitedBy().getName(),
            existingAccount,
            "Tu invitacion esta lista. Entra o crea tu cuenta para unirte al equipo."
        );
    }

    @Transactional
    public void acceptInvitation(String rawToken, AppUser user, WorkGroupService workGroupService) {
        WorkGroupInvitation invitation = resolveInvitationStrict(rawToken);
        String userEmail = inputSanitizer.normalizeEmail(user.getEmail());
        if (!userEmail.equals(inputSanitizer.normalizeEmail(invitation.getEmail()))) {
            throw new ResponseStatusException(FORBIDDEN, "La invitacion pertenece a otro correo.");
        }

        workGroupService.addMembership(invitation.getWorkGroup(), user, WorkGroupRoleName.MEMBER, MembershipStatus.ACTIVE);
        user.setTeam(invitation.getWorkGroup().getName());
        appUserRepository.save(user);

        invitation.setAcceptedAt(Instant.now());
        workGroupInvitationRepository.save(invitation);
    }

    private void requireOwnership(WorkGroup workGroup, AppUser currentUser) {
        if (workGroup.getOwner() == null || !workGroup.getOwner().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Solo el administrador del equipo puede gestionar miembros.");
        }
    }

    private WorkGroupInvitation resolveInvitationStrict(String rawToken) {
        WorkGroupInvitation invitation = resolveInvitation(rawToken);
        if (invitation == null) {
            throw new ResponseStatusException(BAD_REQUEST, "La invitacion ya no esta disponible.");
        }
        return invitation;
    }

    private WorkGroupInvitation resolveInvitation(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return null;
        }
        return workGroupInvitationRepository.findByTokenHash(hash(rawToken))
            .filter(invitation -> invitation.getAcceptedAt() == null)
            .filter(invitation -> invitation.getRevokedAt() == null)
            .filter(invitation -> invitation.getExpiresAt().isAfter(Instant.now()))
            .orElse(null);
    }

    private String randomToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawValue) {
        try {
            byte[] bytes = MessageDigest.getInstance("SHA-256").digest(rawValue.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte value : bytes) {
                builder.append(String.format("%02x", value));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 unavailable.", ex);
        }
    }
}
