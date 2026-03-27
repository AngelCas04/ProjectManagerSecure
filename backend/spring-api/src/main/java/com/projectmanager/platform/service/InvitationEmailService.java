package com.projectmanager.platform.service;

import com.projectmanager.platform.config.RecoveryProperties;
import com.projectmanager.platform.domain.WorkGroupInvitation;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;
import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Service
public class InvitationEmailService {

    private static final Logger log = LoggerFactory.getLogger(InvitationEmailService.class);

    private final JavaMailSender javaMailSender;
    private final MailProperties mailProperties;
    private final RecoveryProperties recoveryProperties;

    public InvitationEmailService(JavaMailSender javaMailSender, MailProperties mailProperties, RecoveryProperties recoveryProperties) {
        this.javaMailSender = javaMailSender;
        this.mailProperties = mailProperties;
        this.recoveryProperties = recoveryProperties;
    }

    public void sendTeamInvitation(WorkGroupInvitation invitation, String rawToken) {
        String joinUrl = buildJoinUrl(rawToken);

        if (!StringUtils.hasText(mailProperties.getHost())) {
            throw new ResponseStatusException(
                SERVICE_UNAVAILABLE,
                "No se pudo enviar la invitacion porque el correo no esta configurado."
            );
        }

        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(formatFromAddress());
            helper.setTo(invitation.getEmail());
            helper.setSubject("Te invitaron a un equipo en Project Manager");
            helper.setText(buildPlainTextBody(invitation, joinUrl), buildHtmlBody(invitation, joinUrl));
            javaMailSender.send(message);
        } catch (Exception ex) {
            log.error("No pudimos enviar la invitacion de equipo a {}. Enlace generado: {}", invitation.getEmail(), joinUrl, ex);
            throw new ResponseStatusException(
                BAD_GATEWAY,
                "No se pudo enviar la invitacion por correo. Verifica la configuracion SMTP.",
                ex
            );
        }
    }

    private String formatFromAddress() {
        if (StringUtils.hasText(recoveryProperties.getSenderName())) {
            return recoveryProperties.getSenderName() + " <" + recoveryProperties.getSenderAddress() + ">";
        }
        return recoveryProperties.getSenderAddress();
    }

    private String buildJoinUrl(String rawToken) {
        String baseUrl = recoveryProperties.getFrontendBaseUrl().replaceAll("/+$", "");
        return baseUrl + "/join-team?token=" + URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
    }

    private String buildPlainTextBody(WorkGroupInvitation invitation, String joinUrl) {
        String inviterName = invitation.getInvitedBy().getName();
        String teamName = invitation.getWorkGroup().getName();
        return ""
            + "Hola,\n\n"
            + inviterName + " te invito a unirte al equipo " + teamName + " en Project Manager.\n"
            + "Abre este enlace para aceptar la invitacion:\n\n"
            + joinUrl + "\n\n"
            + "Si aun no tienes cuenta, el mismo enlace te llevara a crearla.\n";
    }

    private String buildHtmlBody(WorkGroupInvitation invitation, String joinUrl) {
        String inviterName = HtmlUtils.htmlEscape(invitation.getInvitedBy().getName());
        String teamName = HtmlUtils.htmlEscape(invitation.getWorkGroup().getName());
        String safeUrl = HtmlUtils.htmlEscape(joinUrl);

        return """
            <!doctype html>
            <html lang="es">
              <body style="margin:0;padding:0;background:#f5efe5;font-family:Georgia,'Times New Roman',serif;color:#24180d;">
                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f5efe5;padding:32px 16px;">
                  <tr>
                    <td align="center">
                      <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fffaf3;border:1px solid #eadcc9;border-radius:28px;overflow:hidden;box-shadow:0 24px 60px rgba(94,56,18,0.12);">
                        <tr>
                          <td style="background:linear-gradient(135deg,#201611 0%%,#5d300f 56%%,#a84f28 100%%);padding:40px 40px 32px;color:#fff5e6;">
                            <div style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#f6c8a4;margin-bottom:18px;">Invitacion de equipo</div>
                            <div style="font-size:36px;line-height:1.08;font-weight:700;max-width:460px;">Tu equipo te esta esperando</div>
                            <div style="margin-top:16px;font-size:16px;line-height:1.7;color:#f8dec8;max-width:470px;">
                              %s te invito a unirte a <strong style="color:#fffaf3;">%s</strong> para colaborar en proyectos, mensajes y entregas desde un mismo espacio.
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:36px 40px 20px;">
                            <div style="padding:24px;border:1px solid #eadcc9;border-radius:22px;background:#fff;">
                              <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#9c5a2f;margin-bottom:10px;">Siguiente paso</div>
                              <div style="font-size:24px;line-height:1.3;color:#24180d;font-weight:700;margin-bottom:12px;">Acepta la invitacion</div>
                              <div style="font-size:15px;line-height:1.75;color:#6d5643;">
                                Usa el boton para entrar al equipo. Si aun no tienes cuenta, el mismo enlace te guiara para crearla y quedar unido automaticamente.
                              </div>
                              <div style="margin-top:28px;">
                                <a href="%s" style="display:inline-block;background:#b5552c;color:#fffaf3;text-decoration:none;padding:16px 26px;border-radius:999px;font-size:16px;font-weight:700;">
                                  Unirme al equipo
                                </a>
                              </div>
                            </div>
                            <div style="margin-top:22px;padding:18px 20px;background:#f8f1e5;border-radius:18px;font-size:14px;line-height:1.7;color:#6b594a;">
                              Si el boton no abre directamente, copia y pega este enlace en tu navegador:<br />
                              <a href="%s" style="color:#9c4e28;word-break:break-all;">%s</a>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
            """.formatted(inviterName, teamName, safeUrl, safeUrl, safeUrl);
    }
}
