package com.projectmanager.platform.service;

import com.projectmanager.platform.api.AuthRequests;
import com.projectmanager.platform.api.ViewModels;
import com.projectmanager.platform.config.RecoveryProperties;
import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.PasswordRecoveryToken;
import com.projectmanager.platform.repository.AppUserRepository;
import com.projectmanager.platform.repository.PasswordRecoveryTokenRepository;
import com.projectmanager.platform.security.InputSanitizer;
import com.projectmanager.platform.security.RequestMetadataService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class PasswordRecoveryService {

    private final AppUserRepository appUserRepository;
    private final PasswordRecoveryTokenRepository passwordRecoveryTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final InputSanitizer inputSanitizer;
    private final RequestMetadataService requestMetadataService;
    private final RecoveryPhraseService recoveryPhraseService;
    private final RecoveryEmailService recoveryEmailService;
    private final RecoveryProperties recoveryProperties;
    private final RefreshTokenService refreshTokenService;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordRecoveryService(
        AppUserRepository appUserRepository,
        PasswordRecoveryTokenRepository passwordRecoveryTokenRepository,
        PasswordEncoder passwordEncoder,
        InputSanitizer inputSanitizer,
        RequestMetadataService requestMetadataService,
        RecoveryPhraseService recoveryPhraseService,
        RecoveryEmailService recoveryEmailService,
        RecoveryProperties recoveryProperties,
        RefreshTokenService refreshTokenService
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordRecoveryTokenRepository = passwordRecoveryTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.inputSanitizer = inputSanitizer;
        this.requestMetadataService = requestMetadataService;
        this.recoveryPhraseService = recoveryPhraseService;
        this.recoveryEmailService = recoveryEmailService;
        this.recoveryProperties = recoveryProperties;
        this.refreshTokenService = refreshTokenService;
    }

    public ViewModels.PasswordRecoveryRequestView requestRecovery(AuthRequests.ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        String email = inputSanitizer.normalizeEmail(request.email());
        String recoveryPhrase = recoveryPhraseService.normalize(request.recoveryPhrase());

        appUserRepository.findByEmail(email)
            .filter(AppUser::isEnabled)
            .filter(user -> user.getRecoveryPhraseHash() != null && passwordEncoder.matches(recoveryPhrase, user.getRecoveryPhraseHash()))
            .ifPresent(user -> {
                invalidateOpenTokens(user);
                PasswordRecoveryToken token = new PasswordRecoveryToken();
                String rawToken = randomToken();
                token.setUser(user);
                token.setTokenHash(hash(rawToken));
                token.setExpiresAt(Instant.now().plusSeconds(recoveryProperties.getTokenTtlSeconds()));
                token.setRequestedByIp(requestMetadataService.clientIp(httpRequest));
                token.setRequestedUserAgent(requestMetadataService.userAgent(httpRequest));
                passwordRecoveryTokenRepository.save(token);
                recoveryEmailService.sendPasswordResetLink(user, rawToken);
            });

        return new ViewModels.PasswordRecoveryRequestView("Si los datos coinciden, te enviamos un enlace para recuperar tu contrasena.");
    }

    public ViewModels.PasswordResetTokenView validateToken(String rawToken) {
        return resolveToken(rawToken) == null
            ? new ViewModels.PasswordResetTokenView(false, "El enlace ya no es valido o vencio.")
            : new ViewModels.PasswordResetTokenView(true, "Puedes crear una nueva contrasena.");
    }

    public ViewModels.PasswordResetTokenView resetPassword(AuthRequests.ResetPasswordRequest request, HttpServletRequest httpRequest) {
        PasswordRecoveryToken token = resolveTokenStrict(request.token());
        validatePassword(request.password());

        AppUser user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        appUserRepository.save(user);

        token.setConsumedAt(Instant.now());
        passwordRecoveryTokenRepository.save(token);
        invalidateOpenTokens(user);
        refreshTokenService.revokeAllForUser(user.getId(), requestMetadataService.clientIp(httpRequest));

        return new ViewModels.PasswordResetTokenView(true, "Tu contrasena fue actualizada. Ya puedes iniciar sesion.");
    }

    private PasswordRecoveryToken resolveTokenStrict(String rawToken) {
        PasswordRecoveryToken token = resolveToken(rawToken);
        if (token == null) {
            throw new ResponseStatusException(BAD_REQUEST, "El enlace ya no es valido o vencio.");
        }
        return token;
    }

    private PasswordRecoveryToken resolveToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return null;
        }

        return passwordRecoveryTokenRepository.findByTokenHash(hash(rawToken))
            .filter(token -> token.getConsumedAt() == null)
            .filter(token -> token.getExpiresAt().isAfter(Instant.now()))
            .orElse(null);
    }

    private void invalidateOpenTokens(AppUser user) {
        passwordRecoveryTokenRepository.findAllByUserIdAndConsumedAtIsNull(user.getId()).forEach(token -> {
            token.setConsumedAt(Instant.now());
            passwordRecoveryTokenRepository.save(token);
        });
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 12) {
            throw new ResponseStatusException(BAD_REQUEST, "La contrasena debe tener al menos 12 caracteres.");
        }
        if (!password.matches(".*[A-Z].*") || !password.matches(".*[a-z].*") || !password.matches(".*\\d.*") || !password.matches(".*[^A-Za-z0-9].*")) {
            throw new ResponseStatusException(BAD_REQUEST, "La contrasena debe incluir mayuscula, minuscula, numero y simbolo.");
        }
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
