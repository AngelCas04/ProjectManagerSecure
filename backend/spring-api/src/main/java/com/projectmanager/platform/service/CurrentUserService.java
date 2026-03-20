package com.projectmanager.platform.service;

import com.projectmanager.platform.security.AuthenticatedUser;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class CurrentUserService {

    public AuthenticatedUser requireAuthenticatedUser() {
        Object authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof UsernamePasswordAuthenticationToken token
            && token.getPrincipal() instanceof AuthenticatedUser user) {
            return user;
        }

        throw new ResponseStatusException(UNAUTHORIZED, "Authentication required.");
    }
}
