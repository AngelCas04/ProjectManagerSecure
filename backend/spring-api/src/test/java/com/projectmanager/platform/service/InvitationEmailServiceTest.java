package com.projectmanager.platform.service;

import com.projectmanager.platform.config.RecoveryProperties;
import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.WorkGroup;
import com.projectmanager.platform.domain.WorkGroupInvitation;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Properties;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.BAD_GATEWAY;
import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@ExtendWith(MockitoExtension.class)
class InvitationEmailServiceTest {

    @Mock
    private JavaMailSender javaMailSender;
    @Mock
    private MailProperties mailProperties;

    private RecoveryProperties recoveryProperties;
    private InvitationEmailService invitationEmailService;

    @BeforeEach
    void setUp() {
        recoveryProperties = new RecoveryProperties();
        recoveryProperties.setFrontendBaseUrl("https://app.example.com");
        recoveryProperties.setSenderAddress("noreply@example.com");
        recoveryProperties.setSenderName("Project Manager");
        invitationEmailService = new InvitationEmailService(javaMailSender, mailProperties, recoveryProperties);
    }

    @Test
    void sendTeamInvitationFailsWhenMailIsNotConfigured() {
        when(mailProperties.getHost()).thenReturn("");

        assertThatThrownBy(() -> invitationEmailService.sendTeamInvitation(buildInvitation(), "raw-token"))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
            .isEqualTo(SERVICE_UNAVAILABLE);
    }

    @Test
    void sendTeamInvitationPropagatesMailSendFailures() {
        when(mailProperties.getHost()).thenReturn("smtp.gmail.com");
        when(javaMailSender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));
        doThrow(new MailSendException("boom")).when(javaMailSender).send(any(MimeMessage.class));

        assertThatThrownBy(() -> invitationEmailService.sendTeamInvitation(buildInvitation(), "raw-token"))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
            .isEqualTo(BAD_GATEWAY);
    }

    private WorkGroupInvitation buildInvitation() {
        AppUser inviter = new AppUser();
        ReflectionTestUtils.setField(inviter, "id", UUID.randomUUID());
        inviter.setName("Valeria Ruiz");
        inviter.setEmail("valeria.ruiz@example.com");
        inviter.setTeam("Platform Security");

        WorkGroup workGroup = new WorkGroup();
        ReflectionTestUtils.setField(workGroup, "id", UUID.randomUUID());
        workGroup.setName("Platform Security");
        workGroup.setOwner(inviter);

        WorkGroupInvitation invitation = new WorkGroupInvitation();
        ReflectionTestUtils.setField(invitation, "id", UUID.randomUUID());
        invitation.setWorkGroup(workGroup);
        invitation.setInvitedBy(inviter);
        invitation.setEmail("angel@example.com");
        invitation.setTokenHash("token-hash");
        invitation.setExpiresAt(Instant.now().plusSeconds(3600));
        return invitation;
    }
}
