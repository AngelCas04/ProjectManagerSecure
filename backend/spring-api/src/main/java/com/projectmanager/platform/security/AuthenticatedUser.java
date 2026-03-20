package com.projectmanager.platform.security;

import com.projectmanager.platform.domain.RoleName;

import java.security.Principal;
import java.time.Instant;
import java.util.UUID;

public record AuthenticatedUser(
    UUID userId,
    String email,
    String displayName,
    RoleName role,
    String sessionId,
    Instant issuedAt
) implements Principal {

    @Override
    public String getName() {
        return email;
    }

    public boolean isAdmin() {
        return role == RoleName.ADMINISTRADOR;
    }
}
