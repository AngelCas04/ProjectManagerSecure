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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordRecoveryServiceTest {

    @Mock
    private AppUserRepository appUserRepository;
    @Mock
    private PasswordRecoveryTokenRepository passwordRecoveryTokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private RequestMetadataService requestMetadataService;
    @Mock
    private RecoveryPhraseService recoveryPhraseService;
    @Mock
    private RecoveryEmailService recoveryEmailService;
    @Mock
    private RefreshTokenService refreshTokenService;

    private PasswordRecoveryService passwordRecoveryService;

    @BeforeEach
    void setUp() {
        RecoveryProperties recoveryProperties = new RecoveryProperties();
        recoveryProperties.setTokenTtlSeconds(1800);
        passwordRecoveryService = new PasswordRecoveryService(
            appUserRepository,
            passwordRecoveryTokenRepository,
            passwordEncoder,
            new InputSanitizer(),
            requestMetadataService,
            recoveryPhraseService,
            recoveryEmailService,
            recoveryProperties,
            refreshTokenService
        );
    }

    @Test
    void requestRecoveryCreatesTokenAndSendsEmailWhenPhraseMatches() {
        AppUser user = new AppUser();
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        user.setEmail("valeria.ruiz@acme.dev");
        user.setName("Valeria Ruiz");
        user.setEnabled(true);
        user.setRecoveryPhraseHash("hashed-phrase");

        when(appUserRepository.findByEmail("valeria.ruiz@acme.dev")).thenReturn(Optional.of(user));
        when(recoveryPhraseService.normalize(eq("amber-faro-lumen"))).thenReturn("amber-faro-lumen");
        when(passwordEncoder.matches("amber-faro-lumen", "hashed-phrase")).thenReturn(true);
        when(passwordRecoveryTokenRepository.findAllByUserIdAndConsumedAtIsNull(user.getId())).thenReturn(List.of());
        when(requestMetadataService.clientIp(any())).thenReturn("127.0.0.1");
        when(requestMetadataService.userAgent(any())).thenReturn("JUnit");

        ViewModels.PasswordRecoveryRequestView response = passwordRecoveryService.requestRecovery(
            new AuthRequests.ForgotPasswordRequest("valeria.ruiz@acme.dev", "amber-faro-lumen"),
            new MockHttpServletRequest()
        );

        ArgumentCaptor<PasswordRecoveryToken> tokenCaptor = ArgumentCaptor.forClass(PasswordRecoveryToken.class);
        verify(passwordRecoveryTokenRepository).save(tokenCaptor.capture());
        verify(recoveryEmailService).sendPasswordResetLink(any(AppUser.class), anyString());
        assertThat(tokenCaptor.getValue().getUser()).isEqualTo(user);
        assertThat(response.message()).contains("Si los datos coinciden");
    }

    @Test
    void requestRecoveryStaysGenericWhenPhraseDoesNotMatch() {
        AppUser user = new AppUser();
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        user.setEmail("valeria.ruiz@acme.dev");
        user.setEnabled(true);
        user.setRecoveryPhraseHash("hashed-phrase");

        when(appUserRepository.findByEmail("valeria.ruiz@acme.dev")).thenReturn(Optional.of(user));
        when(recoveryPhraseService.normalize(eq("frase-incorrecta"))).thenReturn("frase-incorrecta");
        when(passwordEncoder.matches("frase-incorrecta", "hashed-phrase")).thenReturn(false);

        ViewModels.PasswordRecoveryRequestView response = passwordRecoveryService.requestRecovery(
            new AuthRequests.ForgotPasswordRequest("valeria.ruiz@acme.dev", "frase-incorrecta"),
            new MockHttpServletRequest()
        );

        verify(passwordRecoveryTokenRepository, never()).save(any());
        verify(recoveryEmailService, never()).sendPasswordResetLink(any(), anyString());
        assertThat(response.message()).contains("Si los datos coinciden");
    }
}
