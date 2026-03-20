package com.projectmanager.platform.service;

import com.projectmanager.platform.api.AuthRequests;
import com.projectmanager.platform.api.ViewModels;
import com.projectmanager.platform.config.SecurityProperties;
import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.LoginAttempt;
import com.projectmanager.platform.domain.RoleName;
import com.projectmanager.platform.repository.AppUserRepository;
import com.projectmanager.platform.repository.LoginAttemptRepository;
import com.projectmanager.platform.security.AuthenticatedUser;
import com.projectmanager.platform.security.BruteForceProtectionService;
import com.projectmanager.platform.security.InputSanitizer;
import com.projectmanager.platform.security.JwtAuthenticationFilter;
import com.projectmanager.platform.security.JwtService;
import com.projectmanager.platform.security.RequestMetadataService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.LOCKED;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final PasswordEncoder passwordEncoder;
    private final InputSanitizer inputSanitizer;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final RequestMetadataService requestMetadataService;
    private final BruteForceProtectionService bruteForceProtectionService;
    private final WorkGroupService workGroupService;
    private final ViewMapper viewMapper;
    private final SecurityProperties securityProperties;

    public AuthService(
        AppUserRepository appUserRepository,
        LoginAttemptRepository loginAttemptRepository,
        PasswordEncoder passwordEncoder,
        InputSanitizer inputSanitizer,
        JwtService jwtService,
        RefreshTokenService refreshTokenService,
        RequestMetadataService requestMetadataService,
        BruteForceProtectionService bruteForceProtectionService,
        WorkGroupService workGroupService,
        ViewMapper viewMapper,
        SecurityProperties securityProperties
    ) {
        this.appUserRepository = appUserRepository;
        this.loginAttemptRepository = loginAttemptRepository;
        this.passwordEncoder = passwordEncoder;
        this.inputSanitizer = inputSanitizer;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.requestMetadataService = requestMetadataService;
        this.bruteForceProtectionService = bruteForceProtectionService;
        this.workGroupService = workGroupService;
        this.viewMapper = viewMapper;
        this.securityProperties = securityProperties;
    }

    public ViewModels.AuthView register(AuthRequests.RegisterRequest request, HttpServletRequest httpRequest, HttpServletResponse response) {
        String email = inputSanitizer.normalizeEmail(request.email());
        if (appUserRepository.existsByEmail(email)) {
            throw new ResponseStatusException(CONFLICT, "Email already registered.");
        }

        validatePassword(request.password());
        String name = inputSanitizer.sanitizePlainText(request.name());
        if (name.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Name is required.");
        }

        String team = inputSanitizer.sanitizePlainText(request.team());
        if (team.isBlank()) {
            team = "General Delivery";
        }

        AppUser user = new AppUser();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setTeam(team);
        user.setRole(RoleName.MIEMBRO_PROYECTO);
        user.setEnabled(true);
        user = appUserRepository.save(user);
        workGroupService.ensureRegistrationMembership(user, team);

        return loginInternal(user, httpRequest, response);
    }

    public ViewModels.AuthView login(AuthRequests.LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse response) {
        String email = inputSanitizer.normalizeEmail(request.email());
        String ip = requestMetadataService.clientIp(httpRequest);
        String key = email + "|" + ip;

        if (bruteForceProtectionService.isLocked(key)) {
            throw new ResponseStatusException(LOCKED, "Account temporarily locked.");
        }

        AppUser user = appUserRepository.findByEmail(email)
            .orElseThrow(() -> invalidCredentials(email, ip, key));

        if (!user.isEnabled() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials(email, ip, key);
        }

        bruteForceProtectionService.recordSuccess(key);
        saveLoginAttempt(email, ip, true);
        return loginInternal(user, httpRequest, response);
    }

    public ViewModels.AuthView refresh(HttpServletRequest request, HttpServletResponse response) {
        String rawRefresh = JwtAuthenticationFilter.extractCookie(request, JwtAuthenticationFilter.REFRESH_COOKIE);
        if (rawRefresh == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Refresh token missing.");
        }

        var token = refreshTokenService.verify(rawRefresh);
        refreshTokenService.revoke(rawRefresh, requestMetadataService.clientIp(request));
        return loginInternal(token.getUser(), request, response);
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        refreshTokenService.revoke(
            JwtAuthenticationFilter.extractCookie(request, JwtAuthenticationFilter.REFRESH_COOKIE),
            requestMetadataService.clientIp(request)
        );
        expireCookie(response, JwtAuthenticationFilter.ACCESS_COOKIE);
        expireCookie(response, JwtAuthenticationFilter.REFRESH_COOKIE);
    }

    private ViewModels.AuthView loginInternal(AppUser user, HttpServletRequest request, HttpServletResponse response) {
        Instant now = Instant.now();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getRole(),
            UUID.randomUUID().toString(),
            now
        );

        String accessToken = jwtService.generateAccessToken(authenticatedUser);
        var refreshToken = refreshTokenService.issue(
            user,
            securityProperties.getRefreshTokenTtlSeconds(),
            requestMetadataService.clientIp(request),
            requestMetadataService.userAgent(request)
        );

        user.setLastLoginAt(now);
        appUserRepository.save(user);

        addCookie(response, JwtAuthenticationFilter.ACCESS_COOKIE, accessToken, jwtService.getAccessTokenTtlSeconds(), true);
        addCookie(response, JwtAuthenticationFilter.REFRESH_COOKIE, refreshToken.rawValue(), securityProperties.getRefreshTokenTtlSeconds(), true);

        ViewModels.UserView userView = new ViewModels.UserView(
            user.getId().toString(),
            user.getName(),
            viewMapper.roleLabel(user.getRole()),
            user.getTeam(),
            user.getEmail(),
            inputSanitizer.toInitials(user.getName())
        );

        return new ViewModels.AuthView(viewMapper.toSessionView(authenticatedUser), userView);
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 12) {
            throw new ResponseStatusException(BAD_REQUEST, "Password must have at least 12 characters.");
        }
        if (!password.matches(".*[A-Z].*") || !password.matches(".*[a-z].*") || !password.matches(".*\\d.*") || !password.matches(".*[^A-Za-z0-9].*")) {
            throw new ResponseStatusException(BAD_REQUEST, "Password must include upper, lower, number and special character.");
        }
    }

    private ResponseStatusException invalidCredentials(String email, String ip, String key) {
        bruteForceProtectionService.recordFailure(key);
        saveLoginAttempt(email, ip, false);
        return new ResponseStatusException(UNAUTHORIZED, "Invalid credentials.");
    }

    private void saveLoginAttempt(String email, String ip, boolean success) {
        LoginAttempt attempt = new LoginAttempt();
        attempt.setEmail(email);
        attempt.setIpAddress(ip);
        attempt.setSuccess(success);
        attempt.setAttemptedAt(Instant.now());
        loginAttemptRepository.save(attempt);
    }

    private void addCookie(HttpServletResponse response, String name, String value, int maxAgeSeconds, boolean httpOnly) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
            .httpOnly(httpOnly)
            .secure(securityProperties.isSecureCookies())
            .sameSite(securityProperties.getCookieSameSite())
            .path("/")
            .maxAge(maxAgeSeconds)
            .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    private void expireCookie(HttpServletResponse response, String name) {
        ResponseCookie cookie = ResponseCookie.from(name, "")
            .httpOnly(true)
            .secure(securityProperties.isSecureCookies())
            .sameSite(securityProperties.getCookieSameSite())
            .path("/")
            .maxAge(0)
            .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }
}
