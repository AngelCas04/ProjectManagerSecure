package com.projectmanager.platform.service;

import com.projectmanager.platform.api.AuthRequests;
import com.projectmanager.platform.api.ViewModels;
import com.projectmanager.platform.config.SecurityProperties;
import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.repository.AppUserRepository;
import com.projectmanager.platform.repository.LoginAttemptRepository;
import com.projectmanager.platform.security.BruteForceProtectionService;
import com.projectmanager.platform.security.InputSanitizer;
import com.projectmanager.platform.security.JwtService;
import com.projectmanager.platform.security.RequestMetadataService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AppUserRepository appUserRepository;
    @Mock
    private LoginAttemptRepository loginAttemptRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private RequestMetadataService requestMetadataService;
    @Mock
    private BruteForceProtectionService bruteForceProtectionService;
    @Mock
    private WorkGroupService workGroupService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        SecurityProperties securityProperties = new SecurityProperties();
        securityProperties.setCookieSameSite("Strict");
        securityProperties.setRefreshTokenTtlSeconds(7200);
        securityProperties.setSecureCookies(false);

        InputSanitizer inputSanitizer = new InputSanitizer();
        ViewMapper viewMapper = new ViewMapper(inputSanitizer);

        authService = new AuthService(
            appUserRepository,
            loginAttemptRepository,
            passwordEncoder,
            inputSanitizer,
            jwtService,
            refreshTokenService,
            requestMetadataService,
            bruteForceProtectionService,
            workGroupService,
            viewMapper,
            securityProperties
        );
    }

    @Test
    void registerCreatesPrimaryWorkGroupMembershipForRequestedTeam() {
        when(appUserRepository.existsByEmail("new.user@acme.dev")).thenReturn(false);
        when(passwordEncoder.encode("SecurePass123!")).thenReturn("hashed-password");
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> {
            AppUser user = invocation.getArgument(0);
            if (user.getId() == null) {
                ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
            }
            return user;
        });
        when(jwtService.generateAccessToken(any())).thenReturn("access-token");
        when(refreshTokenService.issue(any(AppUser.class), anyInt(), anyString(), anyString()))
            .thenReturn(new RefreshTokenService.IssuedRefreshToken("refresh-token", null));
        when(requestMetadataService.clientIp(any())).thenReturn("127.0.0.1");
        when(requestMetadataService.userAgent(any())).thenReturn("JUnit");

        ViewModels.AuthView authView = authService.register(
            new AuthRequests.RegisterRequest("  New User  ", "NEW.USER@ACME.DEV", "SecurePass123!", " Platform Security "),
            new MockHttpServletRequest(),
            new MockHttpServletResponse()
        );

        ArgumentCaptor<AppUser> userCaptor = ArgumentCaptor.forClass(AppUser.class);
        verify(workGroupService).ensureRegistrationMembership(userCaptor.capture(), anyString());

        AppUser savedUser = userCaptor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo("new.user@acme.dev");
        assertThat(savedUser.getTeam()).isEqualTo("Platform Security");
        assertThat(authView.currentUser().team()).isEqualTo("Platform Security");
        assertThat(authView.currentUser().email()).isEqualTo("new.user@acme.dev");
    }

    @Test
    void registerRejectsWeakPasswordsBeforePersisting() {
        when(appUserRepository.existsByEmail("weak.user@acme.dev")).thenReturn(false);

        assertThatThrownBy(() -> authService.register(
            new AuthRequests.RegisterRequest("Weak User", "weak.user@acme.dev", "onlylowercase12", "Security"),
            new MockHttpServletRequest(),
            new MockHttpServletResponse()
        ))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
            .isEqualTo(BAD_REQUEST);

        verify(appUserRepository, never()).save(any(AppUser.class));
        verify(workGroupService, never()).ensureRegistrationMembership(any(AppUser.class), anyString());
    }
}
